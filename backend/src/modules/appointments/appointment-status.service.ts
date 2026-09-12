import { pool } from "../../config/db.js";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const validTransitions: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "NO_SHOW", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function isValidTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  return validTransitions[currentStatus].includes(newStatus);
}

export async function updateAppointmentStatus(
  appointmentId: number,
  newStatus: AppointmentStatus,
  changedBy: string,
  reason?: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appointmentResult = await client.query(
      `
      SELECT id, status
      FROM appointments
      WHERE id = $1
      FOR UPDATE
      `,
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      throw new StatusError("Appointment not found", 404);
    }

    const appointment = appointmentResult.rows[0];

    const currentStatus =
      appointment.status as AppointmentStatus;

    if (!isValidTransition(currentStatus, newStatus)) {
      throw new StatusError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        409
      );
    }

    const timestampField: Record<
      AppointmentStatus,
      string | null
    > = {
      PENDING: null,
      CONFIRMED: null,
      CHECKED_IN: "checked_in_at",
      IN_PROGRESS: "started_at",
      COMPLETED: "completed_at",
      CANCELLED: "cancelled_at",
      NO_SHOW: "no_show_at",
    };

    const field = timestampField[newStatus];

    let updateQuery = `
      UPDATE appointments
      SET
        status = $1,
        updated_at = NOW()
    `;

    const values: unknown[] = [newStatus];

    if (field) {
      updateQuery += `, ${field} = NOW()`;
    }

    updateQuery += `
      WHERE id = $2
      RETURNING
        id,
        appointment_number,
        customer_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status,
        checked_in_at,
        started_at,
        completed_at,
        cancelled_at,
        no_show_at,
        updated_at
    `;

    values.push(appointmentId);

    const updatedResult = await client.query(
      updateQuery,
      values
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
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        appointmentId,
        currentStatus,
        newStatus,
        changedBy,
        reason || null,
      ]
    );

    await client.query("COMMIT");

    return updatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export class StatusError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}