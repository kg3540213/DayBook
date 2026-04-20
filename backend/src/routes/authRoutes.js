// backend/src/routes/authRoutes.js

const express = require("express");
const router  = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loginLimiter,
  verifyOtpLimiter,
  resendOtpLimiter,
} = require("../middleware/rateLimiter");

router.post("/signup", authController.signup);

// loginLimiter: 5 attempts / 15 min per IP
router.post("/login", loginLimiter, authController.login);

// verifyOtpLimiter: 5 attempts / 10 min per IP
router.post("/verify-otp", verifyOtpLimiter, authController.verifyOtp);

// resendOtpLimiter: 3 requests / 5 min per IP
router.post("/resend-otp", resendOtpLimiter, authController.resendOtp);

// ── Token refresh ─────────────────────────────────────────────────
// Called automatically by the frontend when it receives a 401.
// Does NOT require authMiddleware — the refresh token IS the credential.
// Rate-limited to prevent refresh token brute-forcing.
router.post(
  "/refresh",
  require("express-rate-limit").rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 20,                   // generous — silent refresh fires automatically
    handler: (req, res) =>
      res.status(429).json({ message: "Too many refresh attempts. Please wait." }),
    standardHeaders: "draft-6",
    legacyHeaders:   false,
  }),
  authController.refresh
);

// Logout — authMiddleware required so we can clean up by req.user._id
router.post("/logout", authMiddleware, authController.logout);

// ── Protected routes ──────────────────────────────────────────────
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;