import { Router } from "express";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";
import { getDashboard, getAnalytics } from "./admin.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 *       403:
 *         description: Insufficient permissions
 */
router.get("/dashboard", getDashboard);


/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get operational analytics
 *     description: Get appointment, service, branch, and resource utilization analytics for the admin dashboard.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 90
 *           default: 30
 *         description: Number of days to include in the analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       400:
 *         description: Invalid days parameter
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get("/analytics", getAnalytics);

export default router;