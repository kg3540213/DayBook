// backend/src/index.js
const express      = require("express");
const http         = require("http");               // NEW
const { Server }   = require("socket.io");          // NEW
const helmet       = require("helmet");
const morgan       = require("morgan");
require("dotenv").config();

const path = require("path");

const connectDB                       = require("./config/database");
const redis                           = require("./config/redis");
const cookieParser                    = require("cookie-parser");
const cors                            = require("cors");
const { verifyEmailConfig }           = require("./services/EmailService");
const { initSocket, setIo }           = require("./socket/socketHandler"); // NEW

const app    = express();
const server = http.createServer(app);              // NEW — wrap Express

// ── Socket.io setup ───────────────────────────────────────────────
// Allow the same origins as the REST API.  The cookie is forwarded
// in the handshake so our JWT auth middleware can read it.
const io = new Server(server, {                     // NEW
  cors: {
    origin:      [process.env.FRONTEND_URL, "https://lpudaybook.onrender.com"],
    credentials: true,
  },
  // Use websocket first, fallback to polling only if needed
  transports: ["websocket", "polling"],
});

setIo(io);        // expose io to controller emitter helpers
initSocket(io);   // register all event handlers

// ── Startup env check ─────────────────────────────────────────────
console.log("=== ENV CHECK ===");
console.log("PORT        :", process.env.PORT);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("=================");

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
const authRoutes          = require("./routes/authRoutes");
const userRoutes          = require("./routes/userRoutes");
const entryRoutes         = require("./routes/entryRoutes");
const sharedJournalRoutes = require("./routes/sharedJournalRoutes");

app.use("/api/auth",            authRoutes);
app.use("/api/users",           userRoutes);
app.use("/api/entries",         entryRoutes);
app.use("/api/shared-journals", sharedJournalRoutes);

// ── Serve Frontend ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    return res.sendFile(
      path.join(__dirname, "../../frontend/dist/index.html")
    );
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
// IMPORTANT: listen on `server` (http.Server), NOT on `app` (Express).
// Socket.io is attached to `server` — if you called app.listen() instead
// the WebSocket upgrade would never be handled.
connectDB()
  .then(() => {
    console.log("Database connected successfully!");

    verifyEmailConfig();

    server.listen(process.env.PORT, () => {           // CHANGED: server, not app
      console.log(`Server is running on port ${process.env.PORT}!`);
      console.log(`Frontend URL for invite emails: ${process.env.FRONTEND_URL}`);
      console.log(`Socket.io is live on the same port.`);
    });
  })
  .catch((error) => {
    console.error("Database not connected!", error);
    process.exit(1);
  });