import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js";

import {
  joinWaitlistController,
  getMyWaitlistController,
  cancelWaitlistController,
  offerNextWaitlistController,
} from "./waitlist.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", joinWaitlistController);

router.get("/my", getMyWaitlistController);

router.delete("/:id", cancelWaitlistController);

router.post(
  "/offer-next",
  requireRole("STAFF", "ADMIN"),
  offerNextWaitlistController
);

export default router;