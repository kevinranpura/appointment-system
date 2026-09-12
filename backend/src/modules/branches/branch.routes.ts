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

router.get("/", authenticate, getBranches);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createBranch
);

export default router;