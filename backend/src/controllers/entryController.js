const Entry = require("../models/entryModel");
const validator = require("validator");
const { analyzeMood } = require("../services/geminiService");

const createEntry = async (req, res) => {
  const { date, mood, title, content, searchableKeywords, plainContent } =
    req.body;
  const loggedUser = req.user;

  if (!title || !content || !mood)
    return res
      .status(422)
      .json({ message: "Please submit with required fields!" });

  if (!validator.isDate(date)) {
    return res.status(422).json({
      message: "Please provide a valid date!",
    });
  }

  // Note: encrypted content will be longer than original, so we increase limits
  if (title.length > 500) {
    return res.status(422).json({
      message: "Title is too long!",
    });
  }

  if (content.length > 5000) {
    return res.status(422).json({
      message: "Content is too long!",
    });
  }

  try {
    // Analyze mood from plain content if provided, otherwise skip AI analysis
    // Note: plainContent is optional and sent separately for AI analysis
    let aiMood = null;
    if (plainContent) {
      aiMood = await analyzeMood(plainContent);
    }

    const saveEntry = await Entry.create({
      createdBy: loggedUser._id,
      date,
      title,
      mood,
      content,
      aiMood,
      searchableKeywords: searchableKeywords || "",
    });

    res.status(201).json({
      message: "Entry added successfully!",
      saveEntry,
    });
  } catch (error) {
    console.error("Error adding entry!: ", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

const getEntries = async (req, res) => {
  const loggedUser = req.user;

  try {
    const entries = await Entry.find({ createdBy: loggedUser._id })
      .populate("createdBy", "firstName lastName")
      // replace the createdBy field with the firstName and lastName of the user who created the entry
      .sort({ date: -1 });
      // sort in des order, so the latest entry will be shown first
    console.log(entries)

    res
      .status(200)
      .json({ message: "Entries fetched successfully!", data: entries });
  } catch (error) {
    console.error("Error fetching entries!: ", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

const getEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId = req.params.id;

  try {
    const entry = await Entry.findOne({
      _id: entryId,
      createdBy: loggedUser._id,
    }).populate("createdBy", "firstName lastName");

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found or does not belong to the logged-in user!",
      });
    }

    res
      .status(200)
      .json({ message: "Entry fetched successfully!", data: entry });
  } catch (error) {
    console.error("Error fetching this entry!: ", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

const updateEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId = req.params.id;
  const { date, title, mood, content, searchableKeywords, plainContent } =
    req.body;

  if (!title || !content || !mood)
    return res
      .status(422)
      .json({ message: "Please submit with required fields!" });

  if (!validator.isDate(date)) {
    return res.status(422).json({
      message: "Please provide a valid date!",
    });
  }

  // Note: encrypted content will be longer than original
  if (title.length > 500) {
    return res.status(422).json({
      message: "Title is too long!",
    });
  }

  if (content.length > 5000) {
    return res.status(422).json({
      message: "Content is too long!",
    });
  }

  try {
    // Analyze mood from plain content if provided
    let aiMood = null;
    if (plainContent) {
      aiMood = await analyzeMood(plainContent);
    }

    const updateData = {
      date,
      title,
      mood,
      content,
      searchableKeywords: searchableKeywords || "",
    };

    // Only update aiMood if we got a valid analysis
    if (aiMood) {
      updateData.aiMood = aiMood;
    }

    const entry = await Entry.findOneAndUpdate(
      { _id: entryId, createdBy: loggedUser._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found or not updated due to permissions!",
      });
    }

    res
      .status(200)
      .json({ message: "Entry updated successfully!", data: entry });
  } catch (error) {
    console.error("Error updating this entry!: ", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

const deleteEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId = req.params.id;

  try {
    const entry = await Entry.findOneAndDelete({
      _id: entryId,
      createdBy: loggedUser._id,
    });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found or not deleted due to permissions!",
      });
    }

    res
      .status(200)
      .json({ message: "Entry deleted successfully!", data: entry });
  } catch (error) {
    console.error("Error deleting this entry!: ", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

const searchEntries = async (req, res) => {
  const loggedUser = req.user;
  const { text, startDate, endDate, mood, aiMood } = req.query;

  try {
    // Build query conditions
    const conditions = [{ createdBy: loggedUser._id }];

    // Text search on searchableKeywords (for encrypted content search)
    if (text?.trim()) {
      if (text.length > 100) {
        return res
          .status(422)
          .json({ message: "Search string cannot exceed 100 characters!" });
      }
      // Use text index on searchableKeywords field
      conditions.push({
        searchableKeywords: { $regex: text, $options: "i" },
      });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate && validator.isDate(startDate)) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate && validator.isDate(endDate)) {
        dateFilter.$lte = new Date(endDate);
      }
      if (Object.keys(dateFilter).length > 0) {
        conditions.push({ date: dateFilter });
      }
    }

    // User-selected mood filter
    if (mood) {
      conditions.push({ mood });
    }

    // AI-detected mood filter
    if (aiMood) {
      conditions.push({ aiMood });
    }

    const entries = await Entry.find({
      $and: conditions,
    }).sort({ date: -1 });

    res.status(200).json({
      message:
        entries.length === 0
          ? "No entries found!"
          : "Entries fetched successfully!",
      data: entries,
    });
  } catch (error) {
    console.error("Error searching the entry!", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

// Get mood analytics for dashboard
const getMoodAnalytics = async (req, res) => {
  const loggedUser = req.user;
  const { days = 7 } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get entries from the specified period
    const entries = await Entry.find({
      createdBy: loggedUser._id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Calculate mood distribution
    const moodCounts = {};
    const aiMoodCounts = {};
    const dailyMoods = {};

    entries.forEach((entry) => {
      // Count user-selected moods
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }

      // Count AI-detected moods
      if (entry.aiMood) {
        aiMoodCounts[entry.aiMood] = (aiMoodCounts[entry.aiMood] || 0) + 1;
      }

      // Group by date for weekly chart
      const dateKey = new Date(entry.date).toISOString().slice(0, 10);
      if (!dailyMoods[dateKey]) {
        dailyMoods[dateKey] = { moods: [], aiMoods: [] };
      }
      if (entry.mood) dailyMoods[dateKey].moods.push(entry.mood);
      if (entry.aiMood) dailyMoods[dateKey].aiMoods.push(entry.aiMood);
    });

    res.status(200).json({
      message: "Analytics fetched successfully!",
      data: {
        totalEntries: entries.length,
        moodCounts,
        aiMoodCounts,
        dailyMoods,
        period: {
          start: startDate.toISOString().slice(0, 10),
          end: new Date().toISOString().slice(0, 10),
          days: parseInt(days),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mood analytics!", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
  getMoodAnalytics,
};
