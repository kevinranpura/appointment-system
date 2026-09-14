import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { 
    createReservationController, 
    getUserReservationsController,
    confirmReservationController,
    cancelReservationController 
} from "./reservation.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getUserReservationsController
);

router.post(
  "/",
  authenticate,
  createReservationController
);

router.post(
  "/:id/confirm",
  authenticate,
  confirmReservationController
);

router.delete(
  "/:id",
  authenticate,
  cancelReservationController
);

export default router;