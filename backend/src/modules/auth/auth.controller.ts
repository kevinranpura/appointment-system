import { Request, Response } from "express";
import { pool } from "../../config/db.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken
} from "../../utils/auth.js";


export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "CUSTOMER",
      roleKey,
    } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
      return;
    }

    const requestedRole = String(role).toUpperCase();

    if (!["CUSTOMER", "STAFF", "ADMIN"].includes(requestedRole)) {
      res.status(400).json({
        success: false,
        message: "Invalid role",
      });
      return;
    }

    // Customer registration does not require a role key.
    // Staff/Admin registration requires the corresponding environment key.
    if (requestedRole === "STAFF") {
      if (!process.env.STAFF_SIGNUP_KEY || roleKey !== process.env.STAFF_SIGNUP_KEY) {
        res.status(403).json({
          success: false,
          message: "Invalid staff signup key",
        });
        return;
      }
    }

    if (requestedRole === "ADMIN") {
      if (!process.env.ADMIN_SIGNUP_KEY || roleKey !== process.env.ADMIN_SIGNUP_KEY) {
        res.status(403).json({
          success: false,
          message: "Invalid admin signup key",
        });
        return;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1 OR phone = $2
      `,
      [normalizedEmail, normalizedPhone]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "A user with this email or phone already exists",
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
      `,
      [
        name.trim(),
        normalizedEmail,
        normalizedPhone,
        passwordHash,
        requestedRole,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT id, name, email, phone, password_hash, role, is_active
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
      return;
    }

    const passwordMatches = await comparePassword(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    await pool.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '7 days'
      )
      `,
      [user.id, refreshTokenHash]
    );

    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT id, name, email, phone, role, is_active, created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        rt.id,
        rt.user_id,
        rt.token_hash,
        rt.expires_at,
        rt.revoked_at,
        u.role,
        u.is_active
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
      `,
    );

    let matchedToken = null;

    for (const row of result.rows) {
      const matches = await compareRefreshToken(
        refreshToken,
        row.token_hash
      );

      if (matches) {
        matchedToken = row;
        break;
      }
    }

    if (!matchedToken) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    if (!matchedToken.is_active) {
      res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
      return;
    }

    // Revoke the old refresh token.
    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      `,
      [matchedToken.id]
    );

    // Generate a new access token.
    const accessToken = generateAccessToken({
      userId: matchedToken.user_id,
      role: matchedToken.role,
    });

    // Rotate the refresh token.
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    await pool.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '7 days'
      )
      `,
      [matchedToken.user_id, newRefreshTokenHash]
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT id, token_hash
      FROM refresh_tokens
      WHERE revoked_at IS NULL
        AND expires_at > NOW()
      `
    );

    for (const row of result.rows) {
      const matches = await compareRefreshToken(
        refreshToken,
        row.token_hash
      );

      if (matches) {
        await pool.query(
          `
          UPDATE refresh_tokens
          SET revoked_at = NOW()
          WHERE id = $1
          `,
          [row.id]
        );

        break;
      }
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}