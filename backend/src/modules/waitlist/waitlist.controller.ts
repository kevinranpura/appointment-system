import { Request, Response } from "express";
import {
  joinWaitlist,
  getMyWaitlist,
  cancelWaitlistEntry,
  offerNextWaitlist,
} from "./waitlist.service.js";

export async function joinWaitlistController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user!.userId;

    const entry = await joinWaitlist({
      customerId: userId,
      branchId: Number(req.body.branchId),
      serviceId: Number(req.body.serviceId),
      requestedDate: req.body.requestedDate,
      requestedStartTime: req.body.requestedStartTime,
      requestedEndTime: req.body.requestedEndTime,
      priority: req.body.priority,
    });

    res.status(201).json({
      message: "Added to waitlist",
      waitlist: entry,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to join waitlist",
    });
  }
}

export async function getMyWaitlistController(
  req: Request,
  res: Response
) {
  try {
    const entries = await getMyWaitlist(req.user!.userId);

    res.json({
      waitlist: entries,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch waitlist",
    });
  }
}

export async function cancelWaitlistController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const entry = await cancelWaitlistEntry(
      Number(req.params.id),
      req.user!.userId
    );

    res.json({
      message: "Waitlist entry cancelled",
      waitlist: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel waitlist entry",
    });
  }
}

export async function offerNextWaitlistController(
  req: Request,
  res: Response
) {
  try {
    const entry = await offerNextWaitlist(
      Number(req.body.branchId),
      Number(req.body.serviceId),
      req.body.requestedDate
    );

    res.json({
      message: "Waitlist offer created",
      waitlist: entry,
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to offer waitlist slot",
    });
  }
}