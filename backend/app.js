import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import badgeRoutes from "./routes/badgeRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = env.clientOrigins;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.some((allowed) => allowed.includes(".vercel.app")) && origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "shadowquest-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/activity", activityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
