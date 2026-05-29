const User = require("../models/userModel");
const Entry = require("../models/entryModel");
const cloudinary = require("../config/cloudinary");

// ── Helper: Calculate Writing Streak and Dynamic Badges ───────────
const getStreakAndBadges = async (userId) => {
  const result = await Entry.aggregate([
    { $match: { createdBy: userId } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
    { $sort: { _id: -1 } },
  ]);

  let currentStreak = 0;
  let longestStreak = 0;
  let totalDays = result.length;

  const dates = result.map((r) => r._id);
  if (dates.length > 0) {
    const toDateStr = (d) => d.toISOString().slice(0, 10);
    const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);
    const today = toDateStr(new Date());
    const yesterday = toDateStr(new Date(Date.now() - 86400000));

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        if (dayDiff(dates[i - 1], dates[i]) === 1) currentStreak++;
        else break;
      }
    }

    longestStreak = 1;
    let runningStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) {
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        runningStreak = 1;
      }
    }
  }

  // dynamically calculate badges based on stats
  const entries = await Entry.find({ createdBy: userId }).select("mood");
  const moods = new Set(entries.map((e) => e.mood).filter(Boolean));

  const badges = [];
  if (entries.length >= 1) {
    badges.push({ id: "first_step", name: "🌱 First Step", desc: "Wrote your first journal entry" });
  }
  if (entries.length >= 5) {
    badges.push({ id: "journaler", name: "📝 Journaler", desc: "Wrote 5 journal entries" });
  }
  if (entries.length >= 15) {
    badges.push({ id: "dedicated", name: "🔥 Dedicated", desc: "Wrote 15 journal entries" });
  }
  if (longestStreak >= 3) {
    badges.push({ id: "streak_starter", name: "⚡ Streak Starter", desc: "Achieved a 3-day writing streak" });
  }
  if (longestStreak >= 7) {
    badges.push({ id: "consistency_master", name: "🏆 Consistency Master", desc: "Achieved a 7-day writing streak" });
  }
  if (moods.size >= 4) {
    badges.push({ id: "mood_pioneer", name: "🌈 Mood Pioneer", desc: "Tracked all 4 main emotions" });
  }

  return {
    streak: { currentStreak, longestStreak, totalDays },
    badges,
  };
};

// ── VIEW PROFILE ──────────────────────────────────────────────────
const viewProfile = (req, res) => {
  const { email, firstName, lastName, profilePhoto } = req.user;
  res.status(200).json({
    message: "Profile fetched successfully!",
    data: {
      email,
      firstName,
      lastName,
      profilePhoto,
    },
  });
};

// ── UPDATE PROFILE (name only) ────────────────────────────────────
const updateProfile = async (req, res) => {
  const loggedUser = req.user;
  const { firstName, lastName } = req.body;

  if (!firstName)
    return res.status(422).json({ message: "First name is required!" });

  if (firstName.length > 50 || (lastName && lastName.length > 50))
    return res.status(422).json({
      message: "First Name and Last Name length should be less than 50!",
    });

  try {
    const updateUser = await User.findByIdAndUpdate(
      loggedUser._id,
      { firstName, lastName },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      data: {
        firstName:    updateUser.firstName,
        lastName:     updateUser.lastName,
        profilePhoto: updateUser.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── GET USER PROFILE BY ID ────────────────────────────────────────
const getUserProfileById = async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.id;

  try {
    const targetUser = await User.findById(targetUserId).select("-password -otpHash");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Full profile view
    const { streak, badges } = await getStreakAndBadges(targetUserId);

    res.status(200).json({
      message: "Profile fetched successfully!",
      data: {
        _id: targetUser._id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        profilePhoto: targetUser.profilePhoto,
        streak,
        badges,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile by ID:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── UPLOAD PHOTO ──────────────────────────────────────────────────
const uploadProfilePhoto = async (req, res) => {
  const loggedUser = req.user;
  const { image }  = req.body;

  if (!image)
    return res.status(400).json({ message: "No image provided!" });

  if (!image.startsWith("data:image/"))
    return res.status(422).json({ message: "Invalid image format. Please upload a JPG, PNG, WEBP, or GIF." });

  try {
    if (loggedUser.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);
      } catch (destroyErr) {
        console.warn("[Cloudinary] Could not delete old photo:", destroyErr.message);
      }
    }

    const result = await cloudinary.uploader.upload(image, {
      folder:         "daybook/profiles",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      resource_type: "image",
    });

    if (!result || !result.secure_url) {
      throw new Error("Cloudinary upload returned an empty response.");
    }

    const updatedUser = await User.findByIdAndUpdate(
      loggedUser._id,
      {
        profilePhoto:         result.secure_url,
        profilePhotoPublicId: result.public_id,
      },
      { new: true }
    );

    res.status(200).json({
      message:      "Profile photo updated successfully!",
      profilePhoto: updatedUser.profilePhoto,
    });
  } catch (error) {
    console.error("[uploadProfilePhoto] Error:", error);
    if (error.message?.includes("Invalid Signature") || error.http_code === 401) {
      return res.status(500).json({
        message: "Cloudinary authentication failed. Check your API credentials in .env.",
      });
    }
    res.status(500).json({
      message: "Failed to upload photo. Please try again later!",
    });
  }
};

// ── DELETE PROFILE PHOTO ──────────────────────────────────────────
const deleteProfilePhoto = async (req, res) => {
  const loggedUser = req.user;

  if (!loggedUser.profilePhotoPublicId)
    return res.status(400).json({ message: "No profile photo to delete!" });

  try {
    await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);

    await User.findByIdAndUpdate(loggedUser._id, {
      profilePhoto:         null,
      profilePhotoPublicId: null,
    });

    res.status(200).json({ message: "Profile photo removed successfully!" });
  } catch (error) {
    console.error("[deleteProfilePhoto] Error:", error);
    res.status(500).json({ message: "Failed to remove photo. Please try again later!" });
  }
};

module.exports = {
  viewProfile,
  updateProfile,
  getUserProfileById,
  uploadProfilePhoto,
  deleteProfilePhoto,
};