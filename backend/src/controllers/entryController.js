const Entry = require("../models/entryModel");
const validator = require("validator");
const { analyzeMood } = require("../services/geminiService");

const createEntry = async (req, res) => {
  const { date, mood, title, content } = req.body;
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

  if (title.length > 20) {
    return res.status(422).json({
      message: "Title length should not be more than 20 characters!",
    });
  }

  if (content.length > 1500) {
    return res.status(422).json({
      message: "Content length should not be more than 1500 characters",
    });
  }

  try {
    const saveEntry = await Entry.create({
      createdBy: loggedUser._id,
      date,
      title,
      mood,
      content,
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
      .sort({ date: -1 });

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
  const { date, title, mood, content } = req.body;

  if (!title || !content || !mood)
    return res
      .status(422)
      .json({ message: "Please submit with required fields!" });

  if (!validator.isDate(date)) {
    return res.status(422).json({
      message: "Please provide a valid date!",
    });
  }

  if (title.length > 20) {
    return res.status(422).json({
      message: "Title length should not be more than 20 characters!",
    });
  }

  if (content.length > 1500) {
    return res.status(422).json({
      message: "Content length should not be more than 1500 characters",
    });
  }

  try {
    const entry = await Entry.findOneAndUpdate(
      { _id: entryId, createdBy: loggedUser._id },
      { date, title, mood, content },
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
  const queryText = req.query.text;

  if (!queryText?.trim()) {
    return res.status(400).json({ message: "Search text is required!" });
  }

  if (queryText.length > 100) {
    return res
      .status(422)
      .json({ message: "Search string cannot exceed 100 characters!" });
  }

  try {
    const entries = await Entry.find({
      $and: [
        {
          $or: [
            { title: { $regex: queryText, $options: "i" } },
            { content: { $regex: queryText, $options: "i" } },
          ],
        },
        { createdBy: loggedUser._id },
      ],
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

// NEW: Calls Gemini to detect mood from journal content
const analyzeEntry = async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res
      .status(400)
      .json({ message: "Content is required for mood analysis!" });
  }

  if (content.length > 1500) {
    return res
      .status(422)
      .json({ message: "Content length should not be more than 1500 characters!" });
  }

  try {
    const mood = await analyzeMood(content);
    res.status(200).json({ message: "Mood analyzed successfully!", mood });
  } catch (error) {
    console.error("Error analyzing mood: ", error);
    res.status(500).json({
      message: "Mood analysis failed! Please try again later.",
    });
  }
};

// NEW: Returns count of entries grouped by mood for the logged-in user
const getMoodAnalytics = async (req, res) => {
  const loggedUser = req.user;

  try {
    const analytics = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Normalize into a flat object: { "🙂": 5, "😔": 2, ... }
    const moodMap = { "🙂": 0, "😔": 0, "😡": 0, "😐": 0 };
    analytics.forEach(({ _id, count }) => {
      if (_id && moodMap[_id] !== undefined) {
        moodMap[_id] = count;
      }
    });

    res.status(200).json({
      message: "Mood analytics fetched successfully!",
      data: moodMap,
    });
  } catch (error) {
    console.error("Error fetching mood analytics: ", error);
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
  analyzeEntry,
  getMoodAnalytics,
};