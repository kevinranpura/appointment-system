import { pool } from "../../config/db.js";
import { reservationQueue } from "../../jobs/reservation.queue.js";
import { createAppointment } from "../appointments/appointment.service.js";

export class ReservationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface CreateReservationInput {
  userId: string;
  branchId: number;
  serviceId: number;
  startTime: string;
}

export async function createReservation(
  input: CreateReservationInput
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Same branch-wide lock used by appointment booking.
    // This serializes competing slot reservations/bookings.
    await client.query(
      `SELECT pg_advisory_xact_lock(123456789, $1)`,
      [input.branchId]
    );

    const serviceResult = await client.query(
      `
      SELECT id, duration_minutes, capacity
      FROM services
      WHERE id = $1
        AND is_active = TRUE
      `,
      [input.serviceId]
    );

    if (serviceResult.rowCount === 0) {
      throw new ReservationError("Service not found", 404);
    }

    const service = serviceResult.rows[0];

    const branchResult = await client.query(
      `
      SELECT id
      FROM branches
      WHERE id = $1
        AND is_active = TRUE
      `,
      [input.branchId]
    );

    if (branchResult.rowCount === 0) {
      throw new ReservationError("Branch not found", 404);
    }

    const startTime = new Date(input.startTime);

    if (Number.isNaN(startTime.getTime())) {
      throw new ReservationError("Invalid start time");
    }

    if (startTime <= new Date()) {
      throw new ReservationError(
        "Reservation start time must be in the future"
      );
    }

    const endTime = new Date(
      startTime.getTime() + service.duration_minutes * 60 * 1000
    );

    const dayOfWeek = startTime.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Working hours
    const hoursResult = await client.query(
      `
      SELECT open_time, close_time
      FROM business_hours
      WHERE branch_id = $1
        AND day_of_week = $2
      `,
      [input.branchId, dayNumber]
    );

    if (hoursResult.rowCount === 0) {
      throw new ReservationError(
        "Branch is closed on this day",
        409
      );
    }

    const hours = hoursResult.rows[0];

    const startMinutes =
      startTime.getHours() * 60 + startTime.getMinutes();

    const endMinutes =
      endTime.getHours() * 60 + endTime.getMinutes();

    const [openHour, openMinute] = String(hours.open_time)
      .split(":")
      .map(Number);

    const [closeHour, closeMinute] = String(hours.close_time)
      .split(":")
      .map(Number);

    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    if (
      startMinutes < openMinutes ||
      endMinutes > closeMinutes
    ) {
      throw new ReservationError(
        "Requested slot is outside business hours",
        409
      );
    }

    // Holiday check
    const holidayResult = await client.query(
      `
      SELECT 1
      FROM holidays
      WHERE branch_id = $1
        AND holiday_date = $2::date
      `,
      [input.branchId, startTime]
    );

    if ((holidayResult.rowCount ?? 0) > 0) {
      throw new ReservationError(
        "Branch is closed for a holiday",
        409
      );
    }

    // Break check
    const startTimeString = startTime.toLocaleTimeString("en-GB", {
        hour12: false,
    });

    const endTimeString = endTime.toLocaleTimeString("en-GB", {
        hour12: false,
    });

    const breakResult = await client.query(
        `
        SELECT 1
        FROM branch_breaks
        WHERE branch_id = $1
            AND start_time < $3::time
            AND end_time > $2::time
        `,
        [input.branchId, startTimeString, endTimeString]
    );

    if ((breakResult.rowCount ?? 0) > 0) {
      throw new ReservationError(
        "Requested slot overlaps a branch break",
        409
      );
    }

    // Existing appointments
    const appointmentResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE branch_id = $1
        AND service_id = $2
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND start_time < $4
        AND end_time > $3
      `,
      [
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
      ]
    );

    const appointmentCount =
      appointmentResult.rows[0].count;

    // Existing active reservations
    const reservationResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM reservations
      WHERE branch_id = $1
        AND service_id = $2
        AND status = 'ACTIVE'
        AND expires_at > NOW()
        AND start_time < $4
        AND end_time > $3
      `,
      [
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
      ]
    );

    const reservationCount =
      reservationResult.rows[0].count;

    if (
      appointmentCount + reservationCount >=
      service.capacity
    ) {
      throw new ReservationError(
        "This slot is no longer available",
        409
      );
    }

    // Prevent the same user from holding the same slot twice.
    const existingUserReservation = await client.query(
      `
      SELECT id
      FROM reservations
      WHERE user_id = $1
        AND branch_id = $2
        AND service_id = $3
        AND start_time = $4
        AND status = 'ACTIVE'
        AND expires_at > NOW()
      `,
      [
        input.userId,
        input.branchId,
        input.serviceId,
        startTime,
      ]
    );

    if ((existingUserReservation.rowCount ?? 0) > 0) {
      throw new ReservationError(
        "You already have an active reservation for this slot",
        409
      );
    }

    // reservation temporary hold
    const reservationTtlSeconds = Number(
        process.env.RESERVATION_TTL_SECONDS || 300
    );

    const expiresAt = new Date(
        Date.now() + reservationTtlSeconds * 1000
    );

    const reservationInsert = await client.query(
      `
      INSERT INTO reservations (
        user_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
      RETURNING
        id,
        user_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status,
        expires_at,
        created_at
      `,
      [
        input.userId,
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
        expiresAt,
      ]
    );

    const expiryJob = await reservationQueue.add(
        "expire-reservation",
        {
            reservationId: reservationInsert.rows[0].id,
        },
        {
            // delay: 5 * 60 * 1000,
            delay: reservationTtlSeconds * 1000,
            attempts: 3,
            removeOnComplete: true,
            removeOnFail: 100,
        }
    );
    console.log(
        "Reservation expiry job created:",
        expiryJob.id,
        reservationInsert.rows[0].id
    );

    await client.query("COMMIT");

    return reservationInsert.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserReservations(
  userId: string
) {
  const result = await pool.query(
    `
    SELECT
      r.id,
      r.branch_id,
      b.name AS branch_name,
      r.service_id,
      s.name AS service_name,
      r.start_time,
      r.end_time,
      r.status,
      r.expires_at,
      r.created_at
    FROM reservations r
    JOIN branches b ON b.id = r.branch_id
    JOIN services s ON s.id = r.service_id
    WHERE r.user_id = $1
    ORDER BY r.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function cancelReservation(
  reservationId: string,
  userId: string
) {
  const result = await pool.query(
    `
    UPDATE reservations
    SET status = 'CANCELLED'
    WHERE id = $1
      AND user_id = $2
      AND status = 'ACTIVE'
    RETURNING *
    `,
    [reservationId, userId]
  );

  if (result.rowCount === 0) {
    throw new ReservationError(
      "Active reservation not found",
      404
    );
  }

  return result.rows[0];
}

export async function confirmReservation(
  reservationId: string,
  userId: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock this reservation so two confirmation requests
    // cannot convert it simultaneously.
    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        987654321,
        hashtext($1)
      )
      `,
      [reservationId]
    );

    const reservationResult = await client.query(
      `
      SELECT
        id,
        user_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status,
        expires_at
      FROM reservations
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [reservationId, userId]
    );

    if (reservationResult.rowCount === 0) {
      throw new ReservationError(
        "Reservation not found",
        404
      );
    }

    const reservation = reservationResult.rows[0];

    if (reservation.status !== "ACTIVE") {
      throw new ReservationError(
        "Reservation is no longer active",
        409
      );
    }

    if (
      new Date(reservation.expires_at).getTime() <=
      Date.now()
    ) {
      await client.query(
        `
        UPDATE reservations
        SET status = 'EXPIRED'
        WHERE id = $1
        `,
        [reservationId]
      );

      throw new ReservationError(
        "Reservation has expired",
        409
      );
    }

    /*
     * createAppointment performs its own transaction and
     * availability/resource validation.
     *
     * reservationId tells it to ignore this reservation
     * when checking capacity.
     */
    const appointment = await createAppointment({
      customerId: userId,
      branchId: Number(reservation.branch_id),
      serviceId: Number(reservation.service_id),
      startTime: new Date(
        reservation.start_time
      ).toISOString(),
      reservationId,
    });

    await client.query(
      `
      UPDATE reservations
      SET status = 'CONVERTED'
      WHERE id = $1
      `,
      [reservationId]
    );

    await client.query("COMMIT");

    return appointment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}