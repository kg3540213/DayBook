const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const path = require("path");

const connectDB = require("./config/database");
const redis = require("./config/redis");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verifyEmailConfig } = require("./services/EmailService");

const app = express();

// ── Security & Logging ────────────────────────────────────────────
app.use(helmet());
app.use(
  morgan((tokens, req, res) => {
    return tokens.url(req, res);
  }),
);

// ── Core middleware ───────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "https://lpudaybook.onrender.com"],
    credentials: true,
  }),
);

// ── Routes ────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const entryRoutes = require("./routes/entryRoutes");
const sharedJournalRoutes = require("./routes/sharedJournalRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/shared-journals", sharedJournalRoutes); // ← NEW

// ── Serve Frontend (IMPORTANT) ────────────────────────────────────
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  }
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
    
    // Verify email configuration
    verifyEmailConfig();

    server = app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}!`);
    });
  })
  .catch((error) => {
    console.error("Database not connected!", error);
    process.exit(1);
  });
