const Post = require("../models/postModel");
const redis = require("../config/redis");

// ── Helper: Calculate next midnight ────────
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
  const cacheKey = "feed:today";

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

// ── 5. Like a Post ────────────────────────────────────────────
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      return res.status(400).json({ error: "You already liked this post" });
    }

    // Add user to likes
    post.likes.push(userId);
    await post.save();

    // Invalidate cache
    await redis.del("feed:today");

    res.status(200).json({
      message: "Post liked successfully",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
};

// ── 6. Unlike a Post ──────────────────────────────────────────
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user liked the post
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      return res.status(400).json({ error: "You haven't liked this post" });
    }

    // Remove user from likes
    post.likes.splice(likeIndex, 1);
    await post.save();

    // Invalidate cache
    await redis.del("feed:today");

    res.status(200).json({
      message: "Post unliked successfully",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// ── 7. Add Comment to Post ────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userName = req.user.firstName || "Anonymous";

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    if (content.length > 200) {
      return res.status(400).json({ error: "Comment must be 200 characters or less" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Add comment
    const comment = {
      userId,
      userName,
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Invalidate cache
    await redis.del("feed:today");

    res.status(201).json({
      message: "Comment added successfully",
      comment: post.comments[post.comments.length - 1],
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// ── 8. Delete Comment (Own comments only) ─────────────────────
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find comment
    const commentIndex = post.comments.findIndex((c) => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check ownership
    if (post.comments[commentIndex].userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    // Delete comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    // Invalidate cache
    await redis.del("feed:today");

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
