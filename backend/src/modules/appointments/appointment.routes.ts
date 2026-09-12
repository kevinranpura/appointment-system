import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { bookAppointment } from "./appointment.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  bookAppointment
);

export default router;