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
  // Cloudinary secure_url — null means no photo uploaded yet
  profilePhoto: {
    type:    String,
    default: null,
  },
  // Cloudinary public_id — used to delete the old image on re-upload
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
  // Encrypted user data key for client-side entry encryption.
  // The user’s password is required to decrypt this value into the raw dataKey.
  encryptedDataKey: {
      type: String,
      required: false,
      default: null,
  },});

const User = mongoose.model("User", userSchema);

module.exports = User;