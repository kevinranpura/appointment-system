import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js";
import { bookAppointment, changeAppointmentStatus } from "./appointment.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  bookAppointment
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole("STAFF", "ADMIN"),
  changeAppointmentStatus
);

export default router;