import { Request, Response } from "express";
import {BookingError, createAppointment} from "./appointment.service.js";
import { StatusError, updateAppointmentStatus} from "./appointment-status.service.js";

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

export async function changeAppointmentStatus(
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

    const appointmentId = Number(req.params.id);
    const { status, reason } = req.body;

    if (!Number.isInteger(appointmentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
      return;
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "CHECKED_IN",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment status",
      });
      return;
    }

    const appointment = await updateAppointmentStatus(
      appointmentId,
      status,
      req.user.userId,
      reason
    );

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    if (error instanceof StatusError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Change appointment status error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}