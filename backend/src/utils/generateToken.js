// backend/src/utils/generateToken.js
//
// Issues TWO cookies on every successful auth event:
//
//   "token"         — short-lived ACCESS token  (15 minutes)
//                     Verified on every protected request by authMiddleware.
//
//   "refreshToken"  — long-lived REFRESH token  (7 days)
//                     Used ONLY by POST /api/auth/refresh to get a new access token.
//                     A SHA-256 hash of this value is stored in MongoDB so the
//                     server can invalidate it on logout.
//
// Both cookies are httpOnly + secure + sameSite:None so they work cross-origin
// (Render frontend ↔ Render backend) without being accessible to JS.

const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/refreshTokenModel");

// ── helpers ───────────────────────────────────────────────────────

const REFRESH_DAYS    = 7;
const ACCESS_MINUTES  = 15;

const cookieBase = {
  httpOnly: true,
  secure:   true,
  sameSite: "None",
};

/**
 * Hash a refresh token before storing in DB.
 * We never persist the raw token — only its SHA-256 digest.
 */
const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

// ── main export ───────────────────────────────────────────────────

/**
 * generateToken(userId, res)
 *
 * Creates and sets both cookies.  Saves a hashed refresh token record in
 * MongoDB (old records for the same user are cleaned up).
 *
 * Returns the raw refreshToken string so callers can pass it around if needed
 * (currently unused outside this file, but useful for tests).
 */
const generateToken = async (_id, res) => {
  // ── 1. Access token (short-lived) ──────────────────────────────
  const accessToken = jwt.sign(
    { _id },
    process.env.JWT_SECRET,
    { expiresIn: `${ACCESS_MINUTES}m` }
  );

  res.cookie("token", accessToken, {
    ...cookieBase,
    expires: new Date(Date.now() + ACCESS_MINUTES * 60 * 1000),
  });

  // ── 2. Refresh token (long-lived, opaque) ──────────────────────
  // Use crypto.randomBytes so it's not decodable — it carries no claims.
  const rawRefresh  = crypto.randomBytes(40).toString("hex");
  const refreshExpiry = new Date(
    Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000
  );

  res.cookie("refreshToken", rawRefresh, {
    ...cookieBase,
    expires: refreshExpiry,
    // Extra path restriction — browser only sends this cookie to /api/auth/*
    path: "/api/auth",
  });

  // ── 3. Persist hashed refresh token in DB ─────────────────────
  // Remove any existing refresh tokens for this user first (single-session policy).
  // Change to deleteOne() if you want to allow multiple devices simultaneously.
  try {
    await RefreshToken.deleteMany({ userId: _id });
    const result = await RefreshToken.create({
      userId:    _id,
      tokenHash: hashToken(rawRefresh),
      expiresAt: refreshExpiry,
    });
    if (!result) {
      throw new Error("Failed to create refresh token record");
    }
  } catch (err) {
    // Mark as fatal so caller can decide whether to crash or log
    err.isFatal = true;
    throw err;
  }

  return rawRefresh; // returned but callers don't need it
};

// ── named exports for use in authController ──────────────────────
generateToken.hashToken = hashToken;

module.exports = generateToken;