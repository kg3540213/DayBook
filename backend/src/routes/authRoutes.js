const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loginLimiter,
  verifyOtpLimiter,
  resendOtpLimiter,
} = require("../middleware/rateLimiter");


router.post("/signup", authController.signup);

// loginLimiter:    5 attempts / 15 min per IP
// Stops credential-stuffing and password-spray attacks cold.
router.post("/login", loginLimiter, authController.login);

// verifyOtpLimiter: 5 attempts / 10 min per IP
// OTP space is 10^6 — still worth rate-limiting to prevent
// any automated enumeration before expiry kicks in.
router.post("/verify-otp", verifyOtpLimiter, authController.verifyOtp);

// resendOtpLimiter: 3 requests / 5 min per IP
// Prevents email flooding. The authController also enforces a
// per-user 60-second cooldown, so two independent guards are active.
router.post("/resend-otp", resendOtpLimiter, authController.resendOtp);

router.post("/logout", authMiddleware, authController.logout);

// ── Protected routes ──────────────────────────────────────────────
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;