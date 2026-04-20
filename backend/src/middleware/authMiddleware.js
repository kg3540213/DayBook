// backend/src/middleware/authMiddleware.js
//
// Verifies the short-lived ACCESS token ("token" cookie).
// On expiry (TokenExpiredError), returns 401 with { tokenExpired: true }
// so the frontend knows to silently call /api/auth/refresh before retrying.

const jwt  = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message:      "No token found! Please log in and try again!",
      tokenExpired: false,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found! Please log in again!" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Distinguish "token has expired" from "token is invalid/tampered"
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:      "Access token expired.",
        tokenExpired: true,   // ← frontend uses this flag to trigger silent refresh
      });
    }

    console.error("Token verification failed:", error.message);
    return res.status(401).json({
      message:      "Invalid or expired token! Please log in and try again!",
      tokenExpired: false,
    });
  }
};

module.exports = authMiddleware;