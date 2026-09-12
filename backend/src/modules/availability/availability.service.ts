import { pool } from "../../config/db.js";

interface AvailabilityParams {
  branchId: number;
  serviceId: number;
  date: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export async function calculateAvailability({
  branchId,
  serviceId,
  date,
}: AvailabilityParams): Promise<TimeSlot[]> {
  // 1. Get service details.
  const serviceResult = await pool.query(
    `
    SELECT
      id,
      duration_minutes,
      capacity
    FROM services
    WHERE id = $1
      AND is_active = TRUE
    `,
    [serviceId]
  );

  if (serviceResult.rows.length === 0) {
    throw new Error("Service not found");
  }

  const service = serviceResult.rows[0];

  // 2. Validate the date.
  const requestedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(requestedDate.getTime())) {
    throw new Error("Invalid date");
  }

  const dayOfWeek = requestedDate.getDay();

  // 3. Check holidays.
  const holidayResult = await pool.query(
    `
    SELECT id
    FROM holidays
    WHERE branch_id = $1
      AND holiday_date = $2
    `,
    [branchId, date]
  );

  if (holidayResult.rows.length > 0) {
    return [];
  }

  // 4. Get business hours.
  const hoursResult = await pool.query(
    `
    SELECT open_time, close_time
    FROM business_hours
    WHERE branch_id = $1
      AND day_of_week = $2
    `,
    [branchId, dayOfWeek]
  );

  if (hoursResult.rows.length === 0) {
    return [];
  }

  const { open_time, close_time } = hoursResult.rows[0];

  // 5. Get breaks for this branch.
  const breaksResult = await pool.query(
    `
    SELECT start_time, end_time
    FROM branch_breaks
    WHERE branch_id = $1
      AND start_time < $3
      AND end_time > $2
    `,
    [branchId, open_time, close_time]
  );

  const breaks = breaksResult.rows;

  // 6. Get existing appointments.
  const appointmentsResult = await pool.query(
    `
    SELECT start_time, end_time
    FROM appointments
    WHERE branch_id = $1
      AND service_id = $2
      AND start_time::date = $3
      AND status NOT IN ('CANCELLED', 'NO_SHOW')
    `,
    [branchId, serviceId, date]
  );

  // 7. Get active temporary reservations.
  const reservationsResult = await pool.query(
    `
    SELECT start_time, end_time
    FROM reservations
    WHERE branch_id = $1
      AND service_id = $2
      AND start_time::date = $3
      AND status = 'ACTIVE'
      AND expires_at > NOW()
    `,
    [branchId, serviceId, date]
  );

  const slots: TimeSlot[] = [];

  const slotDuration = service.duration_minutes;

  let currentMinutes = timeToMinutes(open_time);
  const closingMinutes = timeToMinutes(close_time);

  while (currentMinutes + slotDuration <= closingMinutes) {
    const slotEndMinutes = currentMinutes + slotDuration;

    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(slotEndMinutes);

    // Check whether the slot overlaps a branch break.
    const overlapsBreak = breaks.some((breakPeriod) =>
      overlaps(
        currentMinutes,
        slotEndMinutes,
        timeToMinutes(breakPeriod.start_time),
        timeToMinutes(breakPeriod.end_time)
      )
    );

    // Count appointments overlapping this slot.
    const appointmentCount = appointmentsResult.rows.filter(
      (appointment) =>
        intervalsOverlap(
          `${date}T${slotStart}`,
          `${date}T${slotEnd}`,
          appointment.start_time,
          appointment.end_time
        )
    ).length;

    // Count active reservations overlapping this slot.
    const reservationCount = reservationsResult.rows.filter(
      (reservation) =>
        intervalsOverlap(
          `${date}T${slotStart}`,
          `${date}T${slotEnd}`,
          reservation.start_time,
          reservation.end_time
        )
    ).length;

    const available =
      !overlapsBreak &&
      appointmentCount + reservationCount < service.capacity;

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available,
    });

    currentMinutes += slotDuration;
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:00`;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

function intervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return (
    new Date(startA).getTime() < new Date(endB).getTime() &&
    new Date(endA).getTime() > new Date(startB).getTime()
  );
}