import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import branchRoutes from "./modules/branches/branch.routes.js";
import serviceRoutes from "./modules/services/service.routes.js";
import businessHoursRoutes from "./modules/branches/business-hours.routes.js";
import availabilityRoutes from "./modules/availability/availability.routes.js";
import appointmentRoutes from "./modules/appointments/appointment.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Smart Appointment API is running",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/business-hours", businessHoursRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);

export default app;