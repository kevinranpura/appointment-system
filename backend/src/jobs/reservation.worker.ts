import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { pool } from "../config/db.js";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("Reservation worker connected to Redis");
});

connection.on("error", (error) => {
  console.error("Reservation worker Redis error:", error);
});

export const reservationWorker = new Worker(
  "reservation-expiry",
  async (job) => {
    console.log(
      "Processing reservation expiry job:",
      job.id,
      job.data
    );
    const reservationId = job.data.reservationId;

    await pool.query(
      `
      UPDATE reservations
      SET status = 'EXPIRED'
      WHERE id = $1
        AND status = 'ACTIVE'
        AND expires_at <= NOW()
      `,
      [reservationId]
    );
  },
  {
    connection,
  }
);

reservationWorker.on("completed", (job) => {
  console.log(
    `Reservation expiry job completed: ${job.id}`
  );
});

reservationWorker.on("failed", (job, error) => {
  console.error(
    `Reservation expiry job failed: ${job?.id}`,
    error
  );
});

console.log("Reservation worker initialized");