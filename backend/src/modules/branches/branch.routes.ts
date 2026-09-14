import { Router } from "express";
import {
  createBranch,
  getBranches,
} from "./branch.controller.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/branches:
 *   get:
 *     tags:
 *       - Branches
 *     summary: List all branches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branches retrieved successfully
 *   post:
 *     tags:
 *       - Branches
 *     summary: Create new branch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 */
router.get("/", authenticate, getBranches);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createBranch
);

export default router;