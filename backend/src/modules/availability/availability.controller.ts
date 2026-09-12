import { Request, Response } from "express";
import { calculateAvailability } from "./availability.service.js";

export async function getAvailability(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const branchId = Number(req.query.branchId);
    const serviceId = Number(req.query.serviceId);
    const date = String(req.query.date || "");

    if (
      !Number.isInteger(branchId) ||
      !Number.isInteger(serviceId) ||
      !date
    ) {
      res.status(400).json({
        success: false,
        message: "branchId, serviceId and date are required",
      });
      return;
    }

    const slots = await calculateAvailability({
      branchId,
      serviceId,
      date,
    });

    res.json({
      success: true,
      branchId,
      serviceId,
      date,
      slots,
    });
  } catch (error) {
    console.error("Get availability error:", error);

    if (
      error instanceof Error &&
      error.message === "Service not found"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}