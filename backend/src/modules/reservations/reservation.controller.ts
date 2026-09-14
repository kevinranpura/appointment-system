import { Request, Response } from "express";
import {
  createReservation,
  getUserReservations,
  cancelReservation,
  confirmReservation,
  ReservationError,
} from "./reservation.service.js";

export async function createReservationController(
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

    const branchId = Number(req.body.branchId);
    const serviceId = Number(req.body.serviceId);
    const { startTime } = req.body;

    if (
      !Number.isInteger(branchId) ||
      !Number.isInteger(serviceId) ||
      !startTime
    ) {
      res.status(400).json({
        success: false,
        message:
          "branchId, serviceId and startTime are required",
      });
      return;
    }

    const reservation = await createReservation({
      userId: req.user.userId,
      branchId,
      serviceId,
      startTime,
    });

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create reservation",
    });
  }
}

export async function getUserReservationsController(
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

    const reservations = await getUserReservations(
      req.user.userId
    );

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error("GET RESERVATIONS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
    });
  }
}

export async function cancelReservationController(
  req: Request<{ id: string }>,
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

    const reservation = await cancelReservation(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to cancel reservation",
    });
  }
}

export async function confirmReservationController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const reservationId = req.params.id;

    if (!reservationId) {
      res.status(400).json({
        success: false,
        message: "Reservation ID is required",
      });
      return;
    }

    const appointment = await confirmReservation(
      reservationId,
      user.userId
    );

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error(
      "CONFIRM RESERVATION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to confirm reservation",
    });
  }
}