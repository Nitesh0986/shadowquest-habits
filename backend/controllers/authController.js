import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildPlayer } from "../services/playerService.js";
import { isValidTimezone } from "../utils/dates.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the email doesn't exist, so a wrong email and a wrong
// password take about the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function cleanName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length < 2 || name.length > 40) {
    throw new AppError(400, "Display name must be 2 to 40 characters.", "VALIDATION_ERROR");
  }
  return name;
}

export function cleanEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new AppError(400, "Enter a valid email address.", "VALIDATION_ERROR");
  }
  return email;
}

// POST /api/auth/signup   { name, email, password, timezone? }
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, timezone } = req.body ?? {};
  const cleaned = { name: cleanName(name), email: cleanEmail(email) };

  if (typeof password !== "string" || password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters.", "VALIDATION_ERROR");
  }
  if (password.length > 72) {
    throw new AppError(400, "Password must be 72 characters or fewer.", "VALIDATION_ERROR");
  }

  if (await User.exists({ email: cleaned.email })) {
    throw new AppError(409, "An account with this email already exists.", "EMAIL_TAKEN");
  }

  const tz = [timezone, req.headers["x-timezone"]].find(isValidTimezone) ?? env.defaultTimezone;
  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await User.create({ ...cleaned, passwordHash, timezone: tz });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, "An account with this email already exists.", "EMAIL_TAKEN");
    throw err;
  }

  res.status(201).json({ token: signToken(user._id), player: await buildPlayer(user) });
});

// POST /api/auth/login   { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError(400, "Enter your email and password to continue.", "VALIDATION_ERROR");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, "Incorrect email or password.", "INVALID_CREDENTIALS");

  res.json({ token: signToken(user._id), player: await buildPlayer(user) });
});

// GET /api/auth/me   (used on page load to restore a session from the stored token)
export const me = asyncHandler(async (req, res) => {
  res.json({ player: await buildPlayer(req.user) });
});
