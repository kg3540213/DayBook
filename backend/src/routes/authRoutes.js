const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loginLimiter,
  signupLimiter,
  passwordChangeLimiter,
} = require("../middleware/rateLimiter");

router.post("/signup", signupLimiter, authController.signup);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.put(
  "/change-password",
  authMiddleware,
  passwordChangeLimiter,
  authController.changePassword
);

module.exports = router;
