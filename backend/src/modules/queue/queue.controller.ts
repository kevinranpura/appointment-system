import { Request, Response } from "express";

import {
  checkInAppointment,
  createWalkIn,
  getQueue,
  callNext,
  startQueueEntry,
  completeQueueEntry,
  markNoShow,
} from "./queue.service.js";

export async function checkInController(
  req: Request,
  res: Response
) {
  try {
    const queueEntry = await checkInAppointment(
      Number(req.body.appointmentId),
      req.user!.userId
    );

    res.status(201).json({
      message: "Appointment checked in",
      queueEntry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Check-in failed",
    });
  }
}

export async function walkInController(
  req: Request,
  res: Response
) {
  try {
    const entry = await createWalkIn({
      branchId: Number(req.body.branchId),
      serviceId: Number(req.body.serviceId),
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      priority: req.body.priority,
    });

    res.status(201).json({
      message: "Walk-in added to queue",
      queueEntry: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to create walk-in",
    });
  }
}

export async function getQueueController(
  req: Request,
  res: Response
) {
  try {
    const queue = await getQueue(Number(req.query.branchId));

    res.json({
      queue,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch queue",
    });
  }
}

export async function callNextController(
  req: Request,
  res: Response
) {
  try {
    const entry = await callNext(Number(req.body.branchId));

    res.json({
      message: "Next customer called",
      queueEntry: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to call next customer",
    });
  }
}

export async function startController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const entry = await startQueueEntry(Number(req.params.id));

    res.json({
      message: "Service started",
      queueEntry: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to start service",
    });
  }
}

export async function completeController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const entry = await completeQueueEntry(Number(req.params.id));

    res.json({
      message: "Service completed",
      queueEntry: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to complete service",
    });
  }
}

export async function noShowController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const entry = await markNoShow(Number(req.params.id));

    res.json({
      message: "Customer marked as no-show",
      queueEntry: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark no-show",
    });
  }
}