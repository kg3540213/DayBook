const { rateLimit } = require("express-rate-limit");

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
    // disable old header
    legacyHeaders: false,
  });



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


const resendOtpLimiter = makeLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message:
    "Too many resend requests from this IP. Please wait 5 minutes and try again.",
});

// Search — 30 attempts per 1 minute per IP.
const searchLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many search requests from this IP. Please wait a minute.",
});

module.exports = { loginLimiter, verifyOtpLimiter, resendOtpLimiter, searchLimiter };