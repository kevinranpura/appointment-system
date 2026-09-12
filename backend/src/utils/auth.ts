import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

export interface AccessTokenPayload {
  userId: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: "60m",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET as string);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    !["CUSTOMER", "STAFF", "ADMIN"].includes(decoded.role)
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: decoded.userId,
    role: decoded.role as AccessTokenPayload["role"],
  };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

export async function compareRefreshToken(
  token: string,
  tokenHash: string
): Promise<boolean> {
  return bcrypt.compare(token, tokenHash);
}