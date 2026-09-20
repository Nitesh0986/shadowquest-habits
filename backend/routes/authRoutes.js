import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import protect from "../middleware/authMiddleware.js";
import { signup, login, me } from "../controllers/authController.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
  message: { message: "Too many attempts. Try again in a few minutes.", code: "RATE_LIMITED" },
});

router.post("/signup", limiter, signup);
router.post("/login", limiter, login);
router.get("/me", protect, me);

export default router;
