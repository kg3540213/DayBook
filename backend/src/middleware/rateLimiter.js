const { rateLimit } = require("express-rate-limit");

// ------------------------------------------------------------------
// makeLimiter
// Factory that creates a pre-configured express-rate-limit instance.
//
// @param {object} opts
//   windowMs  {number}  Time window in milliseconds
//   max       {number}  Max requests allowed within the window
//   message   {string}  Human-readable error sent to the client
//
// Behaviour:
//   - Counts by IP (default keyGenerator)
//   - Returns HTTP 429 with a JSON body on breach
//   - Sets standard RateLimit-* response headers
//   - Does NOT skip successful requests — every attempt counts
// ------------------------------------------------------------------
const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    // Return errors as JSON — consistent with the rest of the API
    handler: (req, res) => {
      return res.status(429).json({ message });
    },
    // Emit standard draft-6 headers (RateLimit-Policy, RateLimit, etc.)
    standardHeaders: "draft-6",
    // Do NOT send the legacy X-RateLimit-* headers
    legacyHeaders: false,
  });

// ── Per-route limiters ────────────────────────────────────────────

// Login — 5 attempts per 15 minutes per IP.
// Throttles credential-stuffing and password-spray attacks.
const loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    "Too many login attempts from this IP. Please wait 15 minutes and try again.",
});

// Verify OTP — 5 attempts per 10 minutes per IP.
// Prevents automated OTP enumeration (10^6 space, but still).
const verifyOtpLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message:
    "Too many verification attempts from this IP. Please wait 10 minutes and try again.",
});

// Resend OTP — 3 requests per 5 minutes per IP.
// Prevents email flooding / SMS-pump abuse.
// Note: the backend also enforces a per-user 60-second cooldown on top
// of this IP-level guard, giving two independent layers of protection.
const resendOtpLimiter = makeLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message:
    "Too many resend requests from this IP. Please wait 5 minutes and try again.",
});

module.exports = { loginLimiter, verifyOtpLimiter, resendOtpLimiter };