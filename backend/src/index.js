const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/database");
const redis = require("./config/redis");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

app.use(helmet());
app.use(
  morgan((tokens, req, res) => {
    return tokens.url(req, res);
  })
);

// ── Core middleware ───────────────────────────────────────────────
// 10mb limit is required for base64-encoded image uploads.
// A 5MB image encodes to ~6.7MB in base64 — 50kb was rejecting all uploads.
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ── Application routes ────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const entryRoutes = require("./routes/entryRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Unhandled error]", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred.",
  });
});

// ── Server startup ────────────────────────────────────────────────
let server;

connectDB()
  .then(() => {
    console.log("Database connected successfully!");
    server = app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}!`);
    });
  })
  .catch((error) => {
    console.error("Database not connected!", error);
    process.exit(1);
  });