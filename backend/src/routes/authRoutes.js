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

// Logout — authMiddleware required so we can clean up by req.user._id
router.post("/logout", authMiddleware, authController.logout);

// ── Protected routes ──────────────────────────────────────────────
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;