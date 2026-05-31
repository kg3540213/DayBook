// backend/src/utils/generateToken.js
//
// Issues a single short-lived JWT access token cookie for authentication.
//
//   "token" — short-lived ACCESS token (15 minutes)
//
// The cookie is httpOnly and environment-aware so it works locally and in
// production without being accessible to JS.

const jwt = require("jsonwebtoken");

// ── helpers ───────────────────────────────────────────────────────

const ACCESS_MINUTES = 15;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};

// ── main export ───────────────────────────────────────────────────

/**
 * generateToken(userId, res)
 *
 * Creates and sets a short-lived JWT access token cookie for the user.
 */
const generateToken = (_id, res) => {
  const accessToken = jwt.sign(
    { _id },
    process.env.JWT_SECRET,
    { expiresIn: `${ACCESS_MINUTES}m` }
  );

  res.cookie("token", accessToken, {
    ...cookieBase,
    expires: new Date(Date.now() + ACCESS_MINUTES * 60 * 1000),
  });
};

module.exports = generateToken;