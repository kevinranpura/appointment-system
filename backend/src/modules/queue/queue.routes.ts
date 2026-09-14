import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

import {
  checkInController,
  walkInController,
  getQueueController,
  callNextController,
  startController,
  completeController,
  noShowController,
} from "./queue.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/check-in",
  checkInController
);

router.post(
  "/walk-in",
  requireRole("STAFF", "ADMIN"),
  walkInController
);

router.get(
  "/",
  getQueueController
);

router.post(
  "/call-next",
  requireRole("STAFF", "ADMIN"),
  callNextController
);

router.patch(
  "/:id/start",
  requireRole("STAFF", "ADMIN"),
  startController
);

router.patch(
  "/:id/complete",
  requireRole("STAFF", "ADMIN"),
  completeController
);

router.patch(
  "/:id/no-show",
  requireRole("STAFF", "ADMIN"),
  noShowController
);

export default router;