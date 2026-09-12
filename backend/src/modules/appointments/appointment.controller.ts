import { Request, Response } from "express";
import {
  BookingError,
  createAppointment,
} from "./appointment.service.js";

export async function bookAppointment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { branchId, serviceId, startTime } = req.body;

    if (!branchId || !serviceId || !startTime) {
      res.status(400).json({
        success: false,
        message:
          "branchId, serviceId and startTime are required",
      });
      return;
    }

    const appointment = await createAppointment({
      customerId: req.user.userId,
      branchId: Number(branchId),
      serviceId: Number(serviceId),
      startTime,
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    if (error instanceof BookingError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Book appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}