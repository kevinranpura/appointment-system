import { Router } from "express";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";
import { getDashboard } from "./admin.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/dashboard", getDashboard);

export default router;