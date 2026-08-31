import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { getClient } from "./infrastructure/config/database";
import UserRepository from "./infrastructure/repositories/UserRepository";
import { SeedAdminUseCase } from "./application/admin/SeedAdminUseCase";
import authRouter from "./presentation/http/routes/authRouter";
import adminRouter from "./presentation/http/routes/adminRouter";
import feedbackRouter from "./presentation/http/routes/feedbackRouter";
import tripRouter from "./presentation/http/routes/tripRouter";
import { errorHandler } from "./presentation/http/middlewares/errorHandler";

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

/**
 * CORS ORIGIN PARSING
 * Supports multiple comma-separated origins (e.g. 3000, 3001, 3002)
 */
const rawCorsOrigin =
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://localhost:3001,http://localhost:3002";

const allowedOrigins = rawCorsOrigin.split(",").map((origin) => origin.trim());

/**
 * GLOBAL MIDDLEWARE
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for local dev
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * DATABASE INITIALIZATION & ADMIN BOOTSTRAP
 */
async function initializeMongoAndSeed(): Promise<void> {
  try {
    const client = await getClient();
    console.log("✅ MongoDB connected successfully to Tripzo cluster");

    // Initialize admin seed
    const userRepository = new UserRepository();
    const seedAdminUseCase = new SeedAdminUseCase(userRepository);
    await seedAdminUseCase.execute();
  } catch (error) {
    console.error("❌ Failed to initialize MongoDB or seed admin:", error);
    throw error;
  }
}

/**
 * HEALTH CHECK ENDPOINTS
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "Tripzo API Engine",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", async (req, res) => {
  try {
    const client = await getClient();
    await client.db("admin").command({ ping: 1 });
    res.status(200).json({ status: "READY", database: "CONNECTED" });
  } catch (err) {
    res.status(503).json({ status: "NOT_READY", database: "DISCONNECTED" });
  }
});

/**
 * API ROUTES (VERSION 1)
 */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/trips", tripRouter);

/**
 * GLOBAL ERROR HANDLER
 */
app.use(errorHandler);

/**
 * START SERVER
 */
async function startServer(): Promise<void> {
  try {
    await initializeMongoAndSeed();

    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(`🚀 Tripzo Backend running on http://localhost:${port}`);
      console.log(`🌐 Allowed CORS Origins: ${allowedOrigins.join(", ")}`);
      console.log(`🔒 Authentication API: http://localhost:${port}/api/v1/auth`);
      console.log(`🛡️  Admin API: http://localhost:${port}/api/v1/admin`);
      console.log(`💬 Feedback API: http://localhost:${port}/api/v1/feedback`);
      console.log(`✈️  AI Travel Planner API: http://localhost:${port}/api/v1/trips`);
    });
  } catch (err) {
    console.error("❌ Fatal error starting server:", err);
    process.exit(1);
  }
}

startServer();
