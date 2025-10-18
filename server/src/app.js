// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import approvalFlowRoutes from "./routes/approvalFlowRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import { fileURLToPath } from "url";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Normalize the GOOGLE_APPLICATION_CREDENTIALS path
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    process.env.GOOGLE_APPLICATION_CREDENTIALS.replace(/\\\\/g, "\\")
  );
  console.log(
    "Resolved Google credentials path:",
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL - must be specific when using credentials
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" })); // Handle JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // Logging

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/approval", approvalRoutes);
app.use("/api/approval-flows", approvalFlowRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/ocr", ocrRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

// Start server
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Server gracefully stopped");
  process.exit(0);
});
