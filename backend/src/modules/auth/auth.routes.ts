import { Router } from "express";
import { getMe, login, logout, register, refresh } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;