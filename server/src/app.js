import express from "express";
import cors from "cors";
import { CLIENT_ORIGIN } from "./config/constants.js";
import { interviewRouter } from "./routes/interviewRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api", interviewRouter);
  return app;
}
