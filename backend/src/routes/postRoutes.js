const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPost,
  getTodayFeed,
  deletePost,
  getUserPostCountToday,
} = require("../controllers/postController");

// ── All routes require authentication ──
router.use(authMiddleware);

// ── Specific routes BEFORE generic routes ──
// Get user's post count for today (specific)
router.get("/my/count", getUserPostCountToday);

// Generic routes (must come after specific routes)
// Get today's feed
router.get("/", getTodayFeed);

// Create new post
router.post("/", createPost);

// Delete own post
router.delete("/:postId", deletePost);

module.exports = router;
