const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loginLimiter,
  verifyOtpLimiter,
  resendOtpLimiter,
} = require("../middleware/rateLimiter");

// ── Public routes (no auth required) ─────────────────────────────

// signup has no rate limiter here intentionally:
//   - It already sends an OTP email, so a spammer is throttled by
//     resend-otp instead once they reach verify / resend.
//   - Adding a tight limit on signup risks locking out legitimate
//     users sharing a corporate NAT/proxy IP.
//   - If you want to add one anyway, use a generous window
//     (e.g. 20 req / 60 min) and add it the same way as below.
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

router.post("/logout", authController.logout);

// ── Protected routes ──────────────────────────────────────────────
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;