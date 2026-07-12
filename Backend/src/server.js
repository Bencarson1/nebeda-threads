import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

import "./config/cloudinary.js";
import connectDB from "./config/db.js";
import { validateEnvironment } from "./config/env.js";
import { stripeWebhookHandler } from "./controllers/paymentController.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customOrderRoutes from "./routes/customOrderRoutes.js";
import emailLogRoutes from "./routes/emailLogRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";

const app = express();
const PORT = Number(process.env.PORT);
let server;

validateEnvironment();

const configuredOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = new Set(["https://nebedathreads.co.uk", ...configuredOrigins]);
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:5173");
}

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, "");

      if (!origin || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  })
);
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Nebeda Threads API is live",
    health: "/api/health",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/email-logs", emailLogRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);

app.use(notFound);
app.use(errorHandler);

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down Nebeda Threads API.`);

  if (server) {
    server.close(async () => {
      await mongoose.connection.close(false);
      process.exit(0);
    });
    return;
  }

  await mongoose.connection.close(false);
  process.exit(0);
};

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error.message);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Nebeda Threads API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
