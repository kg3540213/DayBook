const Post = require("../models/postModel");
const redis = require("../config/redis");

// ── Helper: Calculate next midnight ──
const getNextMidnight = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

// ── Helper: Get user's post count for today ──
const getPostCountForUser = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await Post.countDocuments({
    userId,
    createdAt: { $gte: today, $lt: tomorrow },
  });

  return count;
};

// ── 1. Create Post ──
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;
    const userName = req.user.firstName || "Anonymous";

    // ── Validation ──
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    if (content.length > 300) {
      return res
        .status(400)
        .json({ error: "Content must be 300 characters or less" });
    }

    // ── Check daily post limit ──
    const postCount = await getPostCountForUser(userId);
    if (postCount >= 5) {
      return res.status(429).json({
        error: "You can only create 5 posts per day. Try again tomorrow!",
      });
    }

    // ── Create post ──
    const newPost = new Post({
      userId,
      userName,
      content: content.trim(),
      expiresAt: getNextMidnight(),
    });

    await newPost.save();

    // ── Invalidate cache ──
    await redis.del("feed:today");

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// ── 2. Get Today's Feed ───────────────────────────────────────────
exports.getTodayFeed = async (req, res) => {
  const currentUserId = req.user._id;
  const cacheKey = `feed:today:${currentUserId}`;

  try {
    // ── Check cache first ──
    const cachedFeed = await redis.get(cacheKey);
    if (cachedFeed) {
      return res.status(200).json({
        posts: JSON.parse(cachedFeed),
        cached: true,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const posts = await Post.find({
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ── Cache for 3 minutes ─────────────────────────────────────────────────────
    await redis.setex(cacheKey, 180, JSON.stringify(posts));

    res.status(200).json({
      posts,
      cached: false,
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

// ── 3. Delete Post (Own posts only) ──
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // ── Find post ──
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // ── Check ownership ──
    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    // ── Delete post ──
    await Post.findByIdAndDelete(postId);

    // ── Invalidate cache ──
    await redis.del("feed:today");

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// ── 4. Get User's Post Count Today (For UI feedback) ──
exports.getUserPostCountToday = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await getPostCountForUser(userId);

    res.status(200).json({
      count,
      remaining: 5 - count,
    });
  } catch (error) {
    console.error("Get post count error:", error);
    res.status(500).json({ error: "Failed to get post count" });
  }
};
