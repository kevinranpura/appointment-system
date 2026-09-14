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

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     tags:
 *       - Waitlist
 *     summary: Join waitlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId, serviceId, requested_date]
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               requested_date:
 *                 type: string
 *                 format: date
 *               priority:
 *                 type: string
 *                 enum: [NORMAL, PRIORITY, EMERGENCY]
 */
router.post("/", joinWaitlistController);

/**
 * @swagger
 * /api/waitlist/my:
 *   get:
 *     tags:
 *       - Waitlist
 *     summary: Get my waitlist entries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waitlist entries retrieved
 */
router.get("/my", getMyWaitlistController);

/**
 * @swagger
 * /api/waitlist/{id}:
 *   delete:
 *     tags:
 *       - Waitlist
 *     summary: Cancel waitlist entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete("/:id", cancelWaitlistController);

/**
 * @swagger
 * /api/waitlist/offer-next:
 *   post:
 *     tags:
 *       - Waitlist
 *     summary: Offer slot to next waitlist customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: branchId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: serviceId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 */
router.post(
  "/offer-next",
  requireRole("STAFF", "ADMIN"),
  offerNextWaitlistController
);

export default router;