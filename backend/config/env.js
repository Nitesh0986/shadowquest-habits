import dotenv from "dotenv";
import { isValidTimezone } from "../utils/dates.js";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  defaultTimezone: isValidTimezone(process.env.DEFAULT_TIMEZONE) ? process.env.DEFAULT_TIMEZONE : "UTC",
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 100,
};

// Called once at startup so a missing setting fails loudly instead of at the first login.
export function assertEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGO_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) {
    console.error(`Missing ${missing.join(" and ")} in .env. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}
