import { pool } from "../../config/db.js";

function generateQueueNumber() {
  return `Q-${Date.now().toString().slice(-6)}`;
}

export async function checkInAppointment(
  appointmentId: number,
  customerId: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appointmentResult = await client.query(
      `
      SELECT
        a.*,
        u.name AS customer_name,
        u.phone AS customer_phone,
        s.name AS service_name
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      WHERE a.id = $1
        AND a.customer_id = $2
      FOR UPDATE
      `,
      [appointmentId, customerId]
    );

    if (!appointmentResult.rowCount) {
      throw new Error("Appointment not found");
    }

    const appointment = appointmentResult.rows[0];

    if (appointment.status !== "CONFIRMED") {
      throw new Error("Only confirmed appointments can check in");
    }

    const existing = await client.query(
      `
      SELECT id
      FROM queue_entries
      WHERE appointment_id = $1
        AND status NOT IN ('COMPLETED', 'SKIPPED', 'CANCELLED')
      `,
      [appointmentId]
    );

    if (existing.rowCount) {
      throw new Error("Appointment is already in the queue");
    }

    const queueNumber = generateQueueNumber();

    const queueResult = await client.query(
      `
      INSERT INTO queue_entries (
        branch_id,
        customer_id,
        appointment_id,
        customer_name,
        customer_phone,
        service_id,
        priority,
        queue_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'NORMAL', $7)
      RETURNING *
      `,
      [
        appointment.branch_id,
        appointment.customer_id,
        appointment.id,
        appointment.customer_name,
        appointment.customer_phone,
        appointment.service_id,
        queueNumber,
      ]
    );

    await client.query(
      `
      UPDATE appointments
      SET
        status = 'CHECKED_IN',
        checked_in_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [appointmentId]
    );

    await client.query(
      `
      INSERT INTO appointment_history (
        appointment_id,
        old_status,
        new_status,
        changed_by,
        reason
      )
      VALUES ($1, 'CONFIRMED', 'CHECKED_IN', $2, 'Customer checked in')
      `,
      [appointmentId, customerId]
    );

    await client.query("COMMIT");

    return queueResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createWalkIn(input: {
  branchId: number;
  serviceId: number;
  customerName: string;
  customerPhone?: string;
  priority?: "NORMAL" | "PRIORITY" | "EMERGENCY";
}) {
  const result = await pool.query(
    `
    INSERT INTO queue_entries (
      branch_id,
      customer_name,
      customer_phone,
      service_id,
      priority,
      queue_number
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      input.branchId,
      input.customerName,
      input.customerPhone ?? null,
      input.serviceId,
      input.priority ?? "NORMAL",
      generateQueueNumber(),
    ]
  );

  return result.rows[0];
}

export async function getQueue(branchId: number) {
  const result = await pool.query(
    `
    SELECT
      q.*,
      s.name AS service_name
    FROM queue_entries q
    JOIN services s ON s.id = q.service_id
    WHERE q.branch_id = $1
      AND q.status IN ('WAITING', 'CALLED', 'IN_PROGRESS')
    ORDER BY
      CASE q.priority
        WHEN 'EMERGENCY' THEN 1
        WHEN 'PRIORITY' THEN 2
        ELSE 3
      END,
      q.checked_in_at ASC
    `,
    [branchId]
  );

  return result.rows;
}

export async function callNext(branchId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT *
      FROM queue_entries
      WHERE branch_id = $1
        AND status = 'WAITING'
      ORDER BY
        CASE priority
          WHEN 'EMERGENCY' THEN 1
          WHEN 'PRIORITY' THEN 2
          ELSE 3
        END,
        checked_in_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
      `,
      [branchId]
    );

    if (!result.rowCount) {
      throw new Error("Queue is empty");
    }

    const entry = result.rows[0];

    const updated = await client.query(
      `
      UPDATE queue_entries
      SET
        status = 'CALLED',
        called_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [entry.id]
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

export async function startQueueEntry(id: number) {
  const result = await pool.query(
    `
    UPDATE queue_entries
    SET
      status = 'IN_PROGRESS',
      started_at = NOW()
    WHERE id = $1
      AND status = 'CALLED'
    RETURNING *
    `,
    [id]
  );

  if (!result.rowCount) {
    throw new Error("Queue entry cannot be started");
  }

  if (result.rows[0].appointment_id) {
    await pool.query(
      `
      UPDATE appointments
      SET
        status = 'IN_PROGRESS',
        started_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [result.rows[0].appointment_id]
    );
  }

  return result.rows[0];
}

export async function completeQueueEntry(id: number) {
  const result = await pool.query(
    `
    UPDATE queue_entries
    SET
      status = 'COMPLETED',
      completed_at = NOW()
    WHERE id = $1
      AND status = 'IN_PROGRESS'
    RETURNING *
    `,
    [id]
  );

  if (!result.rowCount) {
    throw new Error("Queue entry cannot be completed");
  }

  if (result.rows[0].appointment_id) {
    await pool.query(
      `
      UPDATE appointments
      SET
        status = 'COMPLETED',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [result.rows[0].appointment_id]
    );
  }

  return result.rows[0];
}

export async function markNoShow(id: number) {
  const result = await pool.query(
    `
    UPDATE queue_entries
    SET status = 'SKIPPED'
    WHERE id = $1
      AND status IN ('WAITING', 'CALLED')
    RETURNING *
    `,
    [id]
  );

  if (!result.rowCount) {
    throw new Error("Queue entry cannot be marked as no-show");
  }

  if (result.rows[0].appointment_id) {
    await pool.query(
      `
      UPDATE appointments
      SET
        status = 'SKIPPED',
        no_show_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [result.rows[0].appointment_id]
    );
  }

  return result.rows[0];
}