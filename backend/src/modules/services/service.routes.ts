import { Router } from "express";
import {
  createService,
  getServices,
} from "./service.controller.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags:
 *       - Services
 *     summary: List all services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *   post:
 *     tags:
 *       - Services
 *     summary: Create new service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, duration_minutes]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration_minutes:
 *                 type: integer
 *               price:
 *                 type: number
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Service created successfully
 */
router.get("/", authenticate, getServices);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createService
);

export default router;