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