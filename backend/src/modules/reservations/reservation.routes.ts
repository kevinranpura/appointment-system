import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { 
    createReservationController, 
    getUserReservationsController,
    confirmReservationController,
    cancelReservationController 
} from "./reservation.controller.js";

const router = Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     tags:
 *       - Reservations
 *     summary: Get my reservations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservations retrieved
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Create a temporary reservation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId, serviceId, start_time, end_time]
 */
router.get(
  "/",
  authenticate,
  getUserReservationsController
);

router.post(
  "/",
  authenticate,
  createReservationController
);

/**
 * @swagger
 * /api/reservations/{id}/confirm:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Confirm a reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation confirmed
 */
router.post(
  "/:id/confirm",
  authenticate,
  confirmReservationController
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     tags:
 *       - Reservations
 *     summary: Cancel a reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled
 */
router.delete(
  "/:id",
  authenticate,
  cancelReservationController
);

export default router;