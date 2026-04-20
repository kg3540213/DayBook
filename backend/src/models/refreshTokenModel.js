// backend/src/models/refreshTokenModel.js
//
// Stores hashed refresh tokens so the server can invalidate them on logout.
// Only a SHA-256 hash is persisted — the raw token never touches the DB.

const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  // Which user owns this token
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
    index:    true,
  },

  // SHA-256 hash of the actual refresh token (never store plaintext)
  tokenHash: {
    type:     String,
    required: true,
    unique:   true,
  },

  // Hard expiry — MongoDB TTL index auto-cleans stale tokens
  expiresAt: {
    type:     Date,
    required: true,
  },

  // When the token was created — useful for auditing
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

// Auto-delete documents when expiresAt is reached
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);