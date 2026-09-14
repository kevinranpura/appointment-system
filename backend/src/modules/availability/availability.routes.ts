import { Router } from "express";
import { getAvailability } from "./availability.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/availability:
 *   get:
 *     tags:
 *       - Availability
 *     summary: Get available time slots
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
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available slots retrieved
 */
router.get("/", authenticate, getAvailability);

export default router;