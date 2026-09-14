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

/**
 * @swagger
 * /api/queue/check-in:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Check in for appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentId]
 *             properties:
 *               appointmentId:
 *                 type: integer
 */
router.post(
  "/check-in",
  checkInController
);

/**
 * @swagger
 * /api/queue/walk-in:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Add walk-in customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId, serviceId, customerName, customerPhone]
 */
router.post(
  "/walk-in",
  requireRole("STAFF", "ADMIN"),
  walkInController
);

/**
 * @swagger
 * /api/queue:
 *   get:
 *     tags:
 *       - Queue
 *     summary: Get queue entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: branchId
 *         in: query
 *         schema:
 *           type: integer
 *       - name: serviceId
 *         in: query
 *         schema:
 *           type: integer
 */
router.get(
  "/",
  getQueueController
);

/**
 * @swagger
 * /api/queue/call-next:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Call next customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: branchId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 */
router.post(
  "/call-next",
  requireRole("STAFF", "ADMIN"),
  callNextController
);

/**
 * @swagger
 * /api/queue/{id}/start:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Start serving customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch(
  "/:id/start",
  requireRole("STAFF", "ADMIN"),
  startController
);

/**
 * @swagger
 * /api/queue/{id}/complete:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Complete service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch(
  "/:id/complete",
  requireRole("STAFF", "ADMIN"),
  completeController
);

/**
 * @swagger
 * /api/queue/{id}/no-show:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Mark as no-show
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch(
  "/:id/no-show",
  requireRole("STAFF", "ADMIN"),
  noShowController
);

export default router;