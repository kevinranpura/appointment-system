import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js";
import { bookAppointment, changeAppointmentStatus, getMyAppointmentsController } from "./appointment.controller.js";

const router = Router();

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Get my appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *     responses:
 *       200:
 *         description: Appointments retrieved
 */
router.get("/my", authenticate, getMyAppointmentsController);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     tags:
 *       - Appointments
 *     summary: Book an appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId, serviceId, start_time, end_time]
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post(
  "/",
  authenticate,
  bookAppointment
);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     tags:
 *       - Appointments
 *     summary: Update appointment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newStatus]
 *             properties:
 *               newStatus:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment status updated
 */
router.patch(
  "/:id/status",
  authenticate,
  requireRole("STAFF", "ADMIN"),
  changeAppointmentStatus
);

export default router;