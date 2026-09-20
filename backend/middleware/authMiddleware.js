import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Checks the "Authorization: Bearer <token>" header and puts the player on req.user.
export default asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Sign in to continue.", "UNAUTHORIZED");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, "Your session has expired. Sign in again.", "UNAUTHORIZED");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "This account no longer exists.", "UNAUTHORIZED");

  req.user = user;
  next();
});
