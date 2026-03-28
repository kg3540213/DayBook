// frontend/src/utils/socket.js
// ─────────────────────────────────────────────────────────────────
// Singleton Socket.io client.
//
// Why a singleton?
//   If every component called `io(URL)` independently you'd get one
//   TCP connection per component mount — wasteful and buggy.
//   Instead we create exactly ONE socket and every module imports the
//   same instance.
//
// Connection strategy:
//   autoConnect: false  →  the socket does NOT connect on import.
//   Call socket.connect() when the user actually opens a shared journal,
//   and socket.disconnect() when they leave.  This avoids an idle
//   WebSocket connection on pages that don't need it.
//
// Auth:
//   withCredentials: true  →  the browser sends the httpOnly JWT cookie
//   in the Socket.io handshake, exactly like it does for fetch() calls.
//   The server's socketAuthMiddleware reads and verifies it there.
// ─────────────────────────────────────────────────────────────────

import { io } from "socket.io-client";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const socket = io(BACKEND_URL, {
  // Don't open the connection until socket.connect() is explicitly called
  autoConnect: false,

  // Send the JWT cookie automatically on every handshake / reconnect
  withCredentials: true,

  // Prefer WebSocket; fall back to long-polling only when WS is blocked
  transports: ["websocket", "polling"],

  // Reconnection settings — reasonable defaults for a journaling app
  reconnection:        true,
  reconnectionAttempts: 5,
  reconnectionDelay:   1000,   // ms before first retry
  reconnectionDelayMax: 5000,  // ms cap between retries
});

// ── Global debug listeners (stripped in production if you prefer) ─
socket.on("connect", () =>
  console.log("[Socket] Connected →", socket.id)
);
socket.on("disconnect", (reason) =>
  console.log("[Socket] Disconnected →", reason)
);
socket.on("connect_error", (err) =>
  console.warn("[Socket] Connection error →", err.message)
);

export default socket;