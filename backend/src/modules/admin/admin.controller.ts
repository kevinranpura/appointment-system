import { Request, Response } from "express";
import { pool } from "../../config/db.js";

export async function getDashboard(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      activeQueue,
      customers,
      branches,
      services,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM appointments
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM appointments
        WHERE start_time::date = CURRENT_DATE
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM appointments
        WHERE status = 'COMPLETED'
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM appointments
        WHERE status = 'CANCELLED'
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM appointments
        WHERE status = 'NO_SHOW'
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM queue_entries
        WHERE status IN ('WAITING', 'CALLED', 'IN_PROGRESS')
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role = 'CUSTOMER'
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM branches
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM services
        WHERE is_active = true
      `),
    ]);

    res.json({
      success: true,
      stats: {
        totalAppointments: totalAppointments.rows[0].count,
        todayAppointments: todayAppointments.rows[0].count,
        completedAppointments: completedAppointments.rows[0].count,
        cancelledAppointments: cancelledAppointments.rows[0].count,
        noShowAppointments: noShowAppointments.rows[0].count,
        activeQueue: activeQueue.rows[0].count,
        customers: customers.rows[0].count,
        branches: branches.rows[0].count,
        services: services.rows[0].count,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
}


export async function getAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const days = Math.min(
      Math.max(Number(req.query.days) || 30, 1),
      90
    );

    const [
      summary,
      appointmentTrend,
      statusDistribution,
      popularServices,
      branchPerformance,
      waitingTime,
      serviceTime,
      resourceUtilization,
    ] = await Promise.all([
      // Overall operational summary
      pool.query(
        `
        SELECT
          COUNT(*)::int AS total_bookings,
          COUNT(*) FILTER (
            WHERE status = 'COMPLETED'
          )::int AS completed,
          COUNT(*) FILTER (
            WHERE status = 'CANCELLED'
          )::int AS cancelled,
          COUNT(*) FILTER (
            WHERE status = 'NO_SHOW'
          )::int AS no_shows
        FROM appointments
        WHERE created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
        `,
        [days]
      ),

      // Daily booking trend
      pool.query(
        `
        SELECT
          TO_CHAR(day, 'Mon DD') AS date,
          COUNT(a.id)::int AS bookings
        FROM generate_series(
          CURRENT_DATE - (($1 - 1) * INTERVAL '1 day'),
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS day
        LEFT JOIN appointments a
          ON a.created_at::date = day::date
        GROUP BY day
        ORDER BY day
        `,
        [days]
      ),

      // Appointment status breakdown
      pool.query(
        `
        SELECT
          status,
          COUNT(*)::int AS count
        FROM appointments
        WHERE created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
        GROUP BY status
        ORDER BY count DESC
        `,
        [days]
      ),

      // Most popular services
      pool.query(
        `
        SELECT
          s.id,
          s.name,
          COUNT(a.id)::int AS bookings
        FROM services s
        LEFT JOIN appointments a
          ON a.service_id = s.id
          AND a.created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
        GROUP BY s.id, s.name
        ORDER BY bookings DESC
        `,
        [days]
      ),

      // Branch performance
      pool.query(
        `
        SELECT
          b.id,
          b.name,
          COUNT(a.id)::int AS bookings,
          COUNT(a.id) FILTER (
            WHERE a.status = 'COMPLETED'
          )::int AS completed,
          COUNT(a.id) FILTER (
            WHERE a.status = 'CANCELLED'
          )::int AS cancelled,
          COUNT(a.id) FILTER (
            WHERE a.status = 'NO_SHOW'
          )::int AS no_shows
        FROM branches b
        LEFT JOIN appointments a
          ON a.branch_id = b.id
          AND a.created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
        GROUP BY b.id, b.name
        ORDER BY bookings DESC
        `,
        [days]
      ),

      // Average queue waiting time:
      // customer checked in -> customer called
      pool.query(
        `
        SELECT
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (called_at - checked_in_at))
              / 60
            )::numeric,
            1
          ) AS average_waiting_minutes
        FROM queue_entries
        WHERE checked_in_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
          AND called_at IS NOT NULL
        `,
        [days]
      ),

      // Average service time:
      // service started -> service completed
      pool.query(
        `
        SELECT
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (completed_at - started_at))
              / 60
            )::numeric,
            1
          ) AS average_service_minutes
        FROM appointments
        WHERE created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
          AND started_at IS NOT NULL
          AND completed_at IS NOT NULL
        `,
        [days]
      ),

      // Resource utilization.
      //
      // booked resource minutes / available resource minutes
      //
      // We calculate utilization for the selected period using
      // branch working hours and resources assigned to appointments.
      pool.query(
        `
        WITH working_minutes AS (
          SELECT
            br.branch_id,
            SUM(
              EXTRACT(
                EPOCH FROM (bh.close_time - bh.open_time)
              ) / 60
            ) * $1 AS available_minutes
          FROM business_hours bh
          JOIN branch_resources br
            ON br.branch_id = bh.branch_id
          GROUP BY br.branch_id
        ),
        booked_minutes AS (
          SELECT
            ar.resource_id,
            SUM(
              EXTRACT(
                EPOCH FROM (a.end_time - a.start_time)
              ) / 60
            ) AS minutes
          FROM appointment_resources ar
          JOIN appointments a
            ON a.id = ar.appointment_id
          WHERE a.created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')
            AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
          GROUP BY ar.resource_id
        )
        SELECT
          r.id,
          r.name,
          r.resource_type,
          COALESCE(bm.minutes, 0) AS booked_minutes,
          COALESCE(
            (
              SELECT wm.available_minutes
              FROM working_minutes wm
              JOIN branch_resources br2
                ON br2.branch_id = wm.branch_id
              WHERE br2.resource_id = r.id
              LIMIT 1
            ),
            0
          ) AS available_minutes
        FROM resources r
        LEFT JOIN booked_minutes bm
          ON bm.resource_id = r.id
        ORDER BY r.name
        `,
        [days]
      ),
    ]);

    const resourceData = resourceUtilization.rows.map((resource) => {
      const booked = Number(resource.booked_minutes) || 0;
      const available = Number(resource.available_minutes) || 0;

      return {
        id: resource.id,
        name: resource.name,
        resourceType: resource.resource_type,
        bookedMinutes: Math.round(booked),
        availableMinutes: Math.round(available),
        utilizationPercent:
          available > 0
            ? Number(((booked / available) * 100).toFixed(1))
            : 0,
      };
    });

    res.json({
      success: true,
      periodDays: days,

      summary: {
        totalBookings: summary.rows[0].total_bookings,
        completed: summary.rows[0].completed,
        cancelled: summary.rows[0].cancelled,
        noShows: summary.rows[0].no_shows,
        averageWaitingMinutes:
          Number(waitingTime.rows[0].average_waiting_minutes) || 0,
        averageServiceMinutes:
          Number(serviceTime.rows[0].average_service_minutes) || 0,
      },

      appointmentTrend: appointmentTrend.rows,

      statusDistribution: statusDistribution.rows,

      popularServices: popularServices.rows,

      branchPerformance: branchPerformance.rows,

      resourceUtilization: resourceData,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load analytics",
    });
  }
}