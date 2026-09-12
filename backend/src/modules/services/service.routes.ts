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

router.get("/", authenticate, getServices);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createService
);

export default router;