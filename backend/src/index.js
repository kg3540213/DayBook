const express    = require("express");
const helmet     = require("helmet");
require("dotenv").config();

const connectDB       = require("./config/database");
const redis           = require("./config/redis");
const cookieParser    = require("cookie-parser");
const cors            = require("cors");
const app = express();


app.use(helmet());

// ── Core middleware ───────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));  // reject oversized payloads
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));



// ── Application routes ────────────────────────────────────────────
const authRoutes  = require("./routes/authRoutes");
const userRoutes  = require("./routes/userRoutes");
const entryRoutes = require("./routes/entryRoutes");

app.use("/api/auth",    authRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/entries", entryRoutes);

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────
// Catches anything thrown inside route handlers that wasn't caught
// by a try/catch.  Returns a clean JSON body instead of an HTML stack.
// eslint-disable-next-line no-unused-vars
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

