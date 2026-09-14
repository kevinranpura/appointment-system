import { Router } from "express";
import {
  getBusinessHours,
  setBusinessHours,
} from "./business-hours.controller.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/business-hours/{branchId}:
 *   get:
 *     tags:
 *       - Business Hours
 *     summary: Get branch business hours
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Business hours retrieved
 *   put:
 *     tags:
 *       - Business Hours
 *     summary: Set branch business hours
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: branchId
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
 *             required: [businessHours]
 *             properties:
 *               businessHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [day_of_week, open_time, close_time]
 *               breaks:
 *                 type: array
 *     responses:
 *       200:
 *         description: Business hours updated successfully
 */
router.get(
  "/:branchId",
  authenticate,
  getBusinessHours
);

router.put(
  "/:branchId",
  authenticate,
  requireRole("ADMIN"),
  setBusinessHours
);

export default router;