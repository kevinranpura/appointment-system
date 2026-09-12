import { Request, Response } from "express";
import { pool } from "../../config/db.js";

export async function getBusinessHours(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const branchId = Number(req.params.branchId);

    if (!Number.isInteger(branchId)) {
      res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        day_of_week,
        open_time,
        close_time
      FROM business_hours
      WHERE branch_id = $1
      ORDER BY day_of_week
      `,
      [branchId]
    );

    res.json({
      success: true,
      businessHours: result.rows,
    });
  } catch (error) {
    console.error("Get business hours error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function setBusinessHours(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const branchId = Number(req.params.branchId);
    const { dayOfWeek, openTime, closeTime } = req.body;

    if (
      !Number.isInteger(branchId) ||
      dayOfWeek === undefined ||
      !openTime ||
      !closeTime
    ) {
      res.status(400).json({
        success: false,
        message:
          "Branch ID, dayOfWeek, openTime and closeTime are required",
      });
      return;
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({
        success: false,
        message: "dayOfWeek must be between 0 and 6",
      });
      return;
    }

    if (openTime >= closeTime) {
      res.status(400).json({
        success: false,
        message: "openTime must be before closeTime",
      });
      return;
    }

    const branch = await pool.query(
      `
      SELECT id
      FROM branches
      WHERE id = $1
      `,
      [branchId]
    );

    if (branch.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Branch not found",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO business_hours (
        branch_id,
        day_of_week,
        open_time,
        close_time
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (branch_id, day_of_week)
      DO UPDATE SET
        open_time = EXCLUDED.open_time,
        close_time = EXCLUDED.close_time
      RETURNING id, branch_id, day_of_week, open_time, close_time
      `,
      [branchId, dayOfWeek, openTime, closeTime]
    );

    res.status(200).json({
      success: true,
      message: "Business hours updated successfully",
      businessHours: result.rows[0],
    });
  } catch (error) {
    console.error("Set business hours error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}