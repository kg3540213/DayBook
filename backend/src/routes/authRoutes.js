const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// ── Public routes (no auth required) ─────────────────────────────
router.post("/signup",      authController.signup);
router.post("/verify-otp",  authController.verifyOtp);
router.post("/resend-otp",  authController.resendOtp);
router.post("/login",       authController.login);
router.post("/logout",      authController.logout);

// ── Protected routes ──────────────────────────────────────────────
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;