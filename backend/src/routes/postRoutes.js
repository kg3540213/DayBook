const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPost,
  getTodayFeed,
  deletePost,
  getUserPostCountToday,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
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

// ── Like/Unlike routes ─────────────────────────────────────────
// Like a post
router.post("/:postId/like", likePost);

// Unlike a post
router.delete("/:postId/like", unlikePost);

// ── Comment routes ────────────────────────────────────────────
// Add comment to post
router.post("/:postId/comment", addComment);

// Delete own comment
router.delete("/:postId/comment/:commentId", deleteComment);

module.exports = router;
