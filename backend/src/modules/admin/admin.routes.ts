import { Router } from "express";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";
import { getDashboard } from "./admin.controller.js";

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

export default router;