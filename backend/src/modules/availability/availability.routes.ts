import { Router } from "express";
import { getAvailability } from "./availability.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getAvailability);

export default router;