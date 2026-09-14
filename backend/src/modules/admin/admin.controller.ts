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
        completedAppointments:
          completedAppointments.rows[0].count,
        cancelledAppointments:
          cancelledAppointments.rows[0].count,
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