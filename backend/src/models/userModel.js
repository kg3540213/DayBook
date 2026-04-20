// backend/src/models/userModel.js
//
// Option A change: encryptedDataKey field removed.
// Encryption key is derived client-side from the password — never stored server-side.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type:     String,
    required: true,
    unique:   true,
  },
  firstName: {
    type:     String,
    required: true,
  },
  lastName: {
    type: String,
  },
  password: {
    type:     String,
    required: true,
  },

  // ── Profile Photo ─────────────────────────────────────────────
  profilePhoto: {
    type:    String,
    default: null,
  },
  profilePhotoPublicId: {
    type:    String,
    default: null,
  },

  // ── Email OTP Verification ────────────────────────────────────
  isVerified: {
    type:    Boolean,
    default: false,
  },
  otpHash: {
    type:    String,
    default: null,
  },
  otpExpiry: {
    type:    Date,
    default: null,
  },
  otpSentAt: {
    type:    Date,
    default: null,
  },
  // NOTE: encryptedDataKey intentionally removed for Option A.
  // The AES key is derived client-side from the user's password using PBKDF2.
});

const User = mongoose.model("User", userSchema);

module.exports = User;