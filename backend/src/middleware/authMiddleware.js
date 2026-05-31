// backend/src/middleware/authMiddleware.js
//
// Verifies the short-lived ACCESS token ("token" cookie).
// On expiry, returns 401 so the client can re-authenticate.

const jwt  = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "No token found! Please log in and try again!",
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
        message: "Access token expired. Please log in again.",
      });
    }

    console.error("Token verification failed:", error.message);
    return res.status(401).json({
      message: "Invalid or expired token! Please log in and try again!",
    });
  }
};

module.exports = authMiddleware;