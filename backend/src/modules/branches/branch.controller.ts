import { Request, Response } from "express";
import { pool } from "../../config/db.js";

export async function getBranches(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        address,
        phone,
        is_active,
        created_at
      FROM branches
      WHERE is_active = TRUE
      ORDER BY name
    `);

    res.json({
      success: true,
      branches: result.rows,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function createBranch(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      res.status(400).json({
        success: false,
        message: "Name, address and phone are required",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO branches (
        name,
        address,
        phone
      )
      VALUES ($1, $2, $3)
      RETURNING id, name, address, phone, is_active, created_at
      `,
      [name.trim(), address.trim(), phone.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch: result.rows[0],
    });
  } catch (error) {
    console.error("Create branch error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}