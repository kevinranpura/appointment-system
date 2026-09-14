import { Queue } from "bullmq";
import { Redis } from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("Reservation queue connected to Redis");
});

connection.on("error", (error) => {
  console.error("Reservation queue Redis error:", error);
});

export const reservationQueue = new Queue(
  "reservation-expiry",
  {
    connection,
  }
);