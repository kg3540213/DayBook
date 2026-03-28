// backend/src/socket/socketHandler.js
// ─────────────────────────────────────────────────────────────────
// Socket.io handler for real-time shared journal collaboration.
//
// Rooms:     each shared journal gets its own room  →  "journal:<journalId>"
// Auth:      JWT is read from the cookie sent in the socket handshake;
//            the decoded userId is attached to socket.data.userId
// Events (server → client):
//   entry:added    — a new shared entry was created
//   entry:updated  — a shared entry was edited
//   entry:deleted  — a shared entry was removed  { entryId }
//   user:typing    — a collaborator started typing  { userId, name, journalId }
//   user:stopped   — a collaborator stopped typing  { userId, journalId }
// Events (client → server):
//   journal:join      — join a journal room  { journalId }
//   journal:leave     — leave a journal room  { journalId }
//   typing:start      — user started composing  { journalId }
//   typing:stop       — user stopped composing  { journalId }
// ─────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/userModel");
const SharedJournal = require("../models/sharedJournalModel");

// ── Helper: room name ─────────────────────────────────────────────
const journalRoom = (journalId) => `journal:${journalId}`;

// ── Auth middleware for Socket.io ─────────────────────────────────
// Reads the JWT from the "token" cookie sent in the handshake headers.
// On success attaches { userId, firstName, lastName } to socket.data.
const socketAuthMiddleware = async (socket, next) => {
  try {
    const rawCookies = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(rawCookies);
    const token = cookies.token;

    if (!token) {
      return next(new Error("AUTH_MISSING: no token cookie"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select(
      "firstName lastName email"
    );

    if (!user) {
      return next(new Error("AUTH_INVALID: user not found"));
    }

    // Attach user info so every event handler can read it
    socket.data.userId    = user._id.toString();
    socket.data.firstName = user.firstName;
    socket.data.lastName  = user.lastName  || "";
    socket.data.name      = `${user.firstName} ${user.lastName || ""}`.trim();

    next();
  } catch (err) {
    console.error("[Socket] Auth error:", err.message);
    next(new Error("AUTH_FAILED: " + err.message));
  }
};

// ── Guard: verify caller is a member of the journal ───────────────
// Returns true if socket.data.userId is owner or collaborator.
const verifyMembership = async (userId, journalId) => {
  const journal = await SharedJournal.findById(journalId).select(
    "owner collaborator status"
  );
  if (!journal || journal.status !== "active") return false;
  const id = userId.toString();
  return (
    journal.owner.toString() === id ||
    (journal.collaborator && journal.collaborator.toString() === id)
  );
};

// ── Main initialiser ──────────────────────────────────────────────
// Call this once from index.js, passing the Socket.io `io` instance.
const initSocket = (io) => {
  // Apply JWT auth middleware to every incoming connection
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { userId, name } = socket.data;
    console.log(`[Socket] Connected — user: ${name} (${userId})`);

    // ── journal:join ─────────────────────────────────────────────
    // The client calls this when it mounts SharedJournalDetail.
    socket.on("journal:join", async ({ journalId }) => {
      if (!journalId) return;

      try {
        const ok = await verifyMembership(userId, journalId);
        if (!ok) {
          socket.emit("error", { message: "Not a member of this journal." });
          return;
        }

        const room = journalRoom(journalId);
        socket.join(room);
        console.log(`[Socket] ${name} joined room ${room}`);

        // Let the other member know this user is online
        socket.to(room).emit("user:online", {
          userId,
          name,
          journalId,
        });
      } catch (err) {
        console.error("[Socket] journal:join error:", err.message);
      }
    });

    // ── journal:leave ────────────────────────────────────────────
    socket.on("journal:leave", ({ journalId }) => {
      if (!journalId) return;
      const room = journalRoom(journalId);
      socket.leave(room);
      socket.to(room).emit("user:offline", { userId, name, journalId });
      console.log(`[Socket] ${name} left room ${room}`);
    });

    // ── typing:start ─────────────────────────────────────────────
    // Broadcast to everyone else in the room that this user is typing.
    socket.on("typing:start", ({ journalId }) => {
      if (!journalId) return;
      socket.to(journalRoom(journalId)).emit("user:typing", {
        userId,
        name,
        journalId,
      });
    });

    // ── typing:stop ──────────────────────────────────────────────
    socket.on("typing:stop", ({ journalId }) => {
      if (!journalId) return;
      socket.to(journalRoom(journalId)).emit("user:stopped", {
        userId,
        journalId,
      });
    });

    // ── disconnect ───────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected — ${name} (${reason})`);
      // Broadcast offline to all rooms this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith("journal:")) {
          const journalId = room.replace("journal:", "");
          socket.to(room).emit("user:offline", { userId, name, journalId });
          socket.to(room).emit("user:stopped", { userId, journalId });
        }
      });
    });
  });

  console.log("[Socket] Socket.io handler initialised.");
};

// ── Emitter helpers ───────────────────────────────────────────────
// Called from sharedJournalController.js after DB writes succeed.
// We export the `io` instance after it's created in index.js so
// controllers can import and call these functions directly.

let _io = null;

const setIo = (io) => {
  _io = io;
};

/**
 * Emit entry:added to everyone in the journal room (including the sender
 * so all open tabs/devices of the same user also update).
 * @param {string} journalId
 * @param {object} entry  — the populated entry document
 */
const emitEntryAdded = (journalId, entry) => {
  if (!_io) return;
  _io.to(journalRoom(journalId)).emit("entry:added", { journalId, entry });
};

/**
 * Emit entry:updated — payload matches the updated populated entry.
 */
const emitEntryUpdated = (journalId, entry) => {
  if (!_io) return;
  _io.to(journalRoom(journalId)).emit("entry:updated", { journalId, entry });
};

/**
 * Emit entry:deleted — only the entryId is needed on the client side.
 */
const emitEntryDeleted = (journalId, entryId) => {
  if (!_io) return;
  _io.to(journalRoom(journalId)).emit("entry:deleted", { journalId, entryId });
};

module.exports = {
  initSocket,
  setIo,
  emitEntryAdded,
  emitEntryUpdated,
  emitEntryDeleted,
};