import crypto from "crypto";
import { pool } from "../../config/db.js";

interface CreateAppointmentInput {
  customerId: string;
  branchId: number;
  serviceId: number;
  startTime: string;
  reservationId?: string;
}

interface CreatedAppointment {
  id: string;
  appointmentNumber: string;
  customerId: string;
  branchId: number;
  serviceId: number;
  startTime: string;
  endTime: string;
  status: string;
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<CreatedAppointment> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Lock the branch for the duration of this transaction.
     *
     * This prevents two concurrent bookings at the same branch
     * from both passing the availability check.
     */
    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        123456789,
        $1
      )
      `,
      [input.branchId]
    );

    // ---------------------------------------------------------
    // 1. Validate branch and service.
    // ---------------------------------------------------------

    const serviceResult = await client.query(
      `
      SELECT
        id,
        duration_minutes,
        capacity
      FROM services
      WHERE id = $1
        AND is_active = TRUE
      `,
      [input.serviceId]
    );

    if (serviceResult.rows.length === 0) {
      throw new BookingError("Service not found", 404);
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

    if (branchResult.rows.length === 0) {
      throw new BookingError("Branch not found", 404);
    }

    // ---------------------------------------------------------
    // 2. Validate start time and calculate end time.
    // ---------------------------------------------------------

    const startDate = new Date(input.startTime);

    if (Number.isNaN(startDate.getTime())) {
      throw new BookingError("Invalid startTime", 400);
    }

    const endDate = new Date(
      startDate.getTime() + service.duration_minutes * 60 * 1000
    );

    const startTime = startDate.toISOString();
    const endTime = endDate.toISOString();

    // ---------------------------------------------------------
    // 3. Check business hours.
    // ---------------------------------------------------------

    const dayOfWeek = startDate.getDay();

    const businessHoursResult = await client.query(
      `
      SELECT open_time, close_time
      FROM business_hours
      WHERE branch_id = $1
        AND day_of_week = $2
      `,
      [input.branchId, dayOfWeek]
    );

    if (businessHoursResult.rows.length === 0) {
      throw new BookingError(
        "The branch is closed on this day",
        409
      );
    }

    const businessHours = businessHoursResult.rows[0];

    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();

    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

    const openingMinutes = timeToMinutes(businessHours.open_time);
    const closingMinutes = timeToMinutes(businessHours.close_time);

    if (
      startMinutes < openingMinutes ||
      endMinutes > closingMinutes
    ) {
      throw new BookingError(
        "Appointment falls outside business hours",
        409
      );
    }

    // ---------------------------------------------------------
    // 4. Check holidays.
    // ---------------------------------------------------------

    const holidayResult = await client.query(
      `
      SELECT id
      FROM holidays
      WHERE branch_id = $1
        AND holiday_date = $2
      `,
      [input.branchId, startDate.toISOString().slice(0, 10)]
    );

    if (holidayResult.rows.length > 0) {
      throw new BookingError(
        "The branch is closed on this holiday",
        409
      );
    }

    // ---------------------------------------------------------
    // 5. Check branch breaks.
    // ---------------------------------------------------------

    const breaksResult = await client.query(
      `
      SELECT start_time, end_time
      FROM branch_breaks
      WHERE branch_id = $1
        AND start_time < $3
        AND end_time > $2
      `,
      [
        input.branchId,
        businessHours.open_time,
        businessHours.close_time,
      ]
    );

    for (const branchBreak of breaksResult.rows) {
      const breakStart = timeToMinutes(branchBreak.start_time);
      const breakEnd = timeToMinutes(branchBreak.end_time);

      if (
        startMinutes < breakEnd &&
        endMinutes > breakStart
      ) {
        throw new BookingError(
          "Appointment overlaps a branch break",
          409
        );
      }
    }

    // ---------------------------------------------------------
    // 6. Check service capacity.
    // ---------------------------------------------------------

    const appointmentCountResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE branch_id = $1
        AND service_id = $2
        AND start_time < $4
        AND end_time > $3
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
      `,
      [
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
      ]
    );

    const appointmentCount =
      appointmentCountResult.rows[0].count;

    if (appointmentCount >= service.capacity) {
      throw new BookingError(
        "No capacity available for this time slot",
        409
      );
    }

    // ---------------------------------------------------------
    // 7. Check temporary reservations.
    // ---------------------------------------------------------

    const reservationCountResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM reservations
      WHERE branch_id = $1
        AND service_id = $2
        AND start_time < $4
        AND end_time > $3
        AND status = 'ACTIVE'
        AND expires_at > NOW()
        AND ($5::uuid IS NULL OR id <> $5::uuid)
      `,
      [
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
        input.reservationId ?? null,
      ]
    );

    const reservationCount =
      reservationCountResult.rows[0].count;

    if (
      appointmentCount +
      reservationCount >=
      service.capacity
    ) {
      throw new BookingError(
        "This slot is no longer available",
        409
      );
    }

    // ---------------------------------------------------------
    // 8. Find required resources.
    // ---------------------------------------------------------

    const requirementsResult = await client.query(
      `
      SELECT resource_type, quantity
      FROM service_resource_requirements
      WHERE service_id = $1
      `,
      [input.serviceId]
    );

    const selectedResourceIds: number[] = [];

    for (const requirement of requirementsResult.rows) {
      const resourcesResult = await client.query(
        `
        SELECT r.id
        FROM resources r
        INNER JOIN branch_resources br
          ON br.resource_id = r.id
        WHERE br.branch_id = $1
          AND r.resource_type = $2
        ORDER BY r.id
        `,
        [
          input.branchId,
          requirement.resource_type,
        ]
      );

      for (const resource of resourcesResult.rows) {
        if (
          selectedResourceIds.length >=
          requirement.quantity
        ) {
          break;
        }

        const resourceId = Number(resource.id);

        // Check whether this resource is already assigned
        // to an overlapping appointment.
        const occupiedResult = await client.query(
          `
          SELECT 1
          FROM appointment_resources ar
          INNER JOIN appointments a
            ON a.id = ar.appointment_id
          WHERE ar.resource_id = $1
            AND a.start_time < $3
            AND a.end_time > $2
            AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
          LIMIT 1
          `,
          [resourceId, startTime, endTime]
        );

        if (occupiedResult.rows.length === 0) {
          selectedResourceIds.push(resourceId);
        }
      }

      const selectedForType = selectedResourceIds.length;

      if (selectedForType < requirement.quantity) {
        throw new BookingError(
          `Insufficient ${requirement.resource_type} resources available`,
          409
        );
      }
    }

    // ---------------------------------------------------------
    // 9. Generate unique appointment number.
    // ---------------------------------------------------------

    const appointmentNumber =
      `APT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // ---------------------------------------------------------
    // 10. Create appointment.
    // ---------------------------------------------------------

    const appointmentResult = await client.query(
      `
      INSERT INTO appointments (
        appointment_number,
        customer_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'CONFIRMED'
      )
      RETURNING
        id,
        appointment_number,
        customer_id,
        branch_id,
        service_id,
        start_time,
        end_time,
        status
      `,
      [
        appointmentNumber,
        input.customerId,
        input.branchId,
        input.serviceId,
        startTime,
        endTime,
      ]
    );

    const appointment = appointmentResult.rows[0];

    // ---------------------------------------------------------
    // 11. Assign resources.
    // ---------------------------------------------------------

    for (const resourceId of selectedResourceIds) {
      await client.query(
        `
        INSERT INTO appointment_resources (
          appointment_id,
          resource_id
        )
        VALUES ($1, $2)
        `,
        [appointment.id, resourceId]
      );
    }

    // ---------------------------------------------------------
    // 12. Create appointment history.
    // ---------------------------------------------------------

    await client.query(
      `
      INSERT INTO appointment_history (
        appointment_id,
        old_status,
        new_status,
        reason
      )
      VALUES ($1, NULL, 'CONFIRMED', 'Appointment booked')
      `,
      [appointment.id]
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

export async function getMyAppointments(customerId: string) {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.appointment_number,
      a.customer_id,
      a.branch_id,
      a.service_id,
      a.start_time,
      a.end_time,
      a.status,
      a.checked_in_at,
      a.started_at,
      a.completed_at,
      a.cancelled_at,
      a.no_show_at,
      a.created_at,
      a.updated_at,
      b.name AS branch_name,
      s.name AS service_name,
      s.duration_minutes,
      s.price
    FROM appointments a
    JOIN branches b ON b.id = a.branch_id
    JOIN services s ON s.id = a.service_id
    WHERE a.customer_id = $1
    ORDER BY a.start_time DESC
    `,
    [customerId]
  );

  return result.rows;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export class BookingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}