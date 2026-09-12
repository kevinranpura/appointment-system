import { Request, Response } from "express";
import { pool } from "../../config/db.js";

export async function getServices(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const branchId = req.query.branchId;

    if (branchId) {
      const result = await pool.query(
        `
        SELECT
          s.id,
          s.name,
          s.description,
          s.duration_minutes,
          s.price,
          s.capacity,
          s.is_active
        FROM services s
        WHERE s.is_active = TRUE
          AND EXISTS (
            SELECT 1
            FROM service_resource_requirements srr
            WHERE srr.service_id = s.id
          )
        ORDER BY s.name
        `,
      );

      res.json({
        success: true,
        services: result.rows,
      });
      return;
    }

    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        duration_minutes,
        price,
        capacity,
        is_active,
        created_at
      FROM services
      WHERE is_active = TRUE
      ORDER BY name
    `);

    res.json({
      success: true,
      services: result.rows,
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function createService(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      name,
      description,
      durationMinutes,
      price,
      capacity,
    } = req.body;

    if (
      !name ||
      !durationMinutes ||
      price === undefined ||
      !capacity
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name, durationMinutes, price and capacity are required",
      });
      return;
    }

    if (durationMinutes <= 0 || capacity <= 0 || price < 0) {
      res.status(400).json({
        success: false,
        message:
          "Duration and capacity must be positive and price cannot be negative",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO services (
        name,
        description,
        duration_minutes,
        price,
        capacity
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        description,
        duration_minutes,
        price,
        capacity,
        is_active,
        created_at
      `,
      [
        name.trim(),
        description?.trim() || null,
        durationMinutes,
        price,
        capacity,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: result.rows[0],
    });
  } catch (error) {
    console.error("Create service error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}