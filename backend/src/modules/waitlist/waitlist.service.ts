import { pool } from "../../config/db.js";

interface JoinWaitlistInput {
  customerId: string;
  branchId: number;
  serviceId: number;
  requestedDate: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  priority?: "NORMAL" | "PRIORITY" | "EMERGENCY";
}

export async function joinWaitlist(input: JoinWaitlistInput) {
  const existing = await pool.query(
    `
    SELECT id
    FROM waitlist
    WHERE customer_id = $1
      AND branch_id = $2
      AND service_id = $3
      AND requested_date = $4
      AND status = 'WAITING'
    `,
    [
      input.customerId,
      input.branchId,
      input.serviceId,
      input.requestedDate,
    ]
  );

  if (existing.rowCount) {
    throw new Error("You are already on the waitlist for this service/date");
  }

  const result = await pool.query(
    `
    INSERT INTO waitlist (
      customer_id,
      branch_id,
      service_id,
      requested_date,
      requested_start_time,
      requested_end_time,
      priority
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      input.customerId,
      input.branchId,
      input.serviceId,
      input.requestedDate,
      input.requestedStartTime ?? null,
      input.requestedEndTime ?? null,
      input.priority ?? "NORMAL",
    ]
  );

  return result.rows[0];
}

export async function getMyWaitlist(customerId: string) {
  const result = await pool.query(
    `
    SELECT
      w.*,
      b.name AS branch_name,
      s.name AS service_name
    FROM waitlist w
    JOIN branches b ON b.id = w.branch_id
    JOIN services s ON s.id = w.service_id
    WHERE w.customer_id = $1
    ORDER BY w.joined_at DESC
    `,
    [customerId]
  );

  return result.rows;
}

export async function cancelWaitlistEntry(
  id: number,
  customerId: string
) {
  const result = await pool.query(
    `
    UPDATE waitlist
    SET status = 'CANCELLED'
    WHERE id = $1
      AND customer_id = $2
      AND status = 'WAITING'
    RETURNING *
    `,
    [id, customerId]
  );

  if (!result.rowCount) {
    throw new Error("Waitlist entry not found or already processed");
  }

  return result.rows[0];
}

/**
 * Staff/Admin can offer the next eligible waitlist entry.
 */
export async function offerNextWaitlist(
  branchId: number,
  serviceId: number,
  requestedDate: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT *
      FROM waitlist
      WHERE branch_id = $1
        AND service_id = $2
        AND requested_date = $3
        AND status = 'WAITING'
      ORDER BY
        CASE priority
          WHEN 'EMERGENCY' THEN 1
          WHEN 'PRIORITY' THEN 2
          ELSE 3
        END,
        joined_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
      `,
      [branchId, serviceId, requestedDate]
    );

    if (!result.rowCount) {
      throw new Error("No eligible customers on the waitlist");
    }

    const entry = result.rows[0];

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const updated = await client.query(
      `
      UPDATE waitlist
      SET
        status = 'OFFERED',
        offered_at = NOW(),
        expires_at = $2
      WHERE id = $1
      RETURNING *
      `,
      [entry.id, expiresAt]
    );

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}