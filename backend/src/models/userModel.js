const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },

  // ── Profile Photo ─────────────────────────────────────────────
  // Cloudinary URL of the uploaded profile picture.
  // null means the user has never uploaded one → show default avatar.
  profilePhoto: {
    type: String,
    default: null,
  },
  // Cloudinary public_id — needed to delete the old image before uploading a new one.
  profilePhotoPublicId: {
    type: String,
    default: null,
  },

  // ── Email OTP Verification ────────────────────────────────────
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Bcrypt hash of the 6-digit OTP — never store raw OTP in DB
  otpHash: {
    type: String,
    default: null,
  },
  // Expiry timestamp — OTP valid for 10 minutes from generation
  otpExpiry: {
    type: Date,
    default: null,
  },
  // Tracks when last OTP was sent — used for 60-second resend cooldown
  otpSentAt: {
    type: Date,
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;