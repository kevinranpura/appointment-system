import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "appointment_user",
  password: process.env.DB_PASSWORD || "appointment_password",
  database: process.env.DB_NAME || "appointment_db"
});