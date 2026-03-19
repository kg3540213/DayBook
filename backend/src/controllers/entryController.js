const Entry = require("../models/entryModel");
const validator = require("validator");
const { analyzeMood } = require("../services/geminiService");

// ─── EXISTING ENDPOINTS ───────────────────────────────────────────

const createEntry = async (req, res) => {
  const { date, mood, title, content } = req.body;
  const loggedUser = req.user;

  if (!title || !content || !mood)
    return res.status(422).json({ message: "Please submit with required fields!" });
  if (!validator.isDate(date))
    return res.status(422).json({ message: "Please provide a valid date!" });
  if (title.length > 20)
    return res.status(422).json({ message: "Title length should not be more than 20 characters!" });
  if (content.length > 1500)
    return res.status(422).json({ message: "Content length should not be more than 1500 characters!" });

  try {
    const saveEntry = await Entry.create({
      createdBy: loggedUser._id,
      date,
      title,
      mood,
      content,
    });
    res.status(201).json({ message: "Entry added successfully!", saveEntry });
  } catch (error) {
    console.error("Error adding entry!: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const getEntries = async (req, res) => {
  const loggedUser = req.user;
  try {
    const entries = await Entry.find({ createdBy: loggedUser._id })
      .populate("createdBy", "firstName lastName")
      .sort({ date: -1 });
    res.status(200).json({ message: "Entries fetched successfully!", data: entries });
  } catch (error) {
    console.error("Error fetching entries!: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
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

    if (!entry)
      return res.status(404).json({ message: "Entry not found or does not belong to the logged-in user!" });

    res.status(200).json({ message: "Entry fetched successfully!", data: entry });
  } catch (error) {
    console.error("Error fetching this entry!: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const updateEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId = req.params.id;
  const { date, title, mood, content } = req.body;

  if (!title || !content || !mood)
    return res.status(422).json({ message: "Please submit with required fields!" });
  if (!validator.isDate(date))
    return res.status(422).json({ message: "Please provide a valid date!" });
  if (title.length > 20)
    return res.status(422).json({ message: "Title length should not be more than 20 characters!" });
  if (content.length > 1500)
    return res.status(422).json({ message: "Content length should not be more than 1500 characters!" });

  try {
    const entry = await Entry.findOneAndUpdate(
      { _id: entryId, createdBy: loggedUser._id },
      { date, title, mood, content },
      { new: true, runValidators: true }
    );
    if (!entry)
      return res.status(404).json({ message: "Entry not found or not updated due to permissions!" });

    res.status(200).json({ message: "Entry updated successfully!", data: entry });
  } catch (error) {
    console.error("Error updating this entry!: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
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
    if (!entry)
      return res.status(404).json({ message: "Entry not found or not deleted due to permissions!" });

    res.status(200).json({ message: "Entry deleted successfully!", data: entry });
  } catch (error) {
    console.error("Error deleting this entry!: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const searchEntries = async (req, res) => {
  const loggedUser = req.user;
  const queryText = req.query.text;

  if (!queryText?.trim())
    return res.status(400).json({ message: "Search text is required!" });
  if (queryText.length > 100)
    return res.status(422).json({ message: "Search string cannot exceed 100 characters!" });

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
      message: entries.length === 0 ? "No entries found!" : "Entries fetched successfully!",
      data: entries,
    });
  } catch (error) {
    console.error("Error searching the entry!", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── ANALYZE ENTRY MOOD (Gemini AI) ───────────────────────────────
// POST /api/entries/analyze
// Receives plain-text content, sends to Gemini, returns mood emoji.
// Content is decrypted on the frontend before being sent here —
// Gemini receives readable text, not ciphertext.
const analyzeEntry = async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim())
    return res.status(422).json({ message: "Content is required for mood analysis!" });

  if (content.length > 1500)
    return res.status(422).json({ message: "Content length should not be more than 1500 characters!" });

  try {
    const mood = await analyzeMood(content);
    res.status(200).json({ message: "Mood analyzed successfully!", mood });
  } catch (error) {
    console.error("Error analyzing mood:", error);
    res.status(500).json({ message: "Failed to analyze mood. Please try again later!" });
  }
};

// ─── ANALYTICS ENDPOINTS ─────────────────────────────────────────

// ------------------------------------------------------------------
// GET /api/entries/analytics/mood
// Groups all user entries by mood emoji and returns counts.
// Uses compound index: { createdBy, date, mood }
//
// Example response:
// { data: { analytics: { "🙂": 5, "😔": 2, "😡": 1, "😐": 3 }, total: 11 } }
// ------------------------------------------------------------------
const getMoodAnalytics = async (req, res) => {
  const loggedUser = req.user;
  try {
    const moodCounts = await Entry.aggregate([
      // Stage 1: narrow to this user's docs — hits compound index
      { $match: { createdBy: loggedUser._id } },
      // Stage 2: group by mood, count each
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);

    const analytics = { "🙂": 0, "😔": 0, "😡": 0, "😐": 0 };
    moodCounts.forEach(({ _id, count }) => {
      if (_id in analytics) analytics[_id] = count;
    });

    const total = Object.values(analytics).reduce((a, b) => a + b, 0);
    res.status(200).json({
      message: "Mood analytics fetched successfully!",
      data: { analytics, total },
    });
  } catch (error) {
    console.error("Error fetching mood analytics: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ------------------------------------------------------------------
// GET /api/entries/analytics/weekly?weeks=8
// Returns entry count grouped by ISO week for the last N weeks.
// Default: last 8 weeks. Max: 52.
//
// Pipeline:
//   $match  → user's docs within the date window
//   $group  → by { isoWeekYear, isoWeek }, count entries
//   $sort   → ascending by year + week
//   $project → shape into { week: "2024-W03", count }
//
// Example response:
// { data: [{ week: "2024-W01", count: 3 }, { week: "2024-W02", count: 5 }, ...] }
// ------------------------------------------------------------------
const getEntriesPerWeek = async (req, res) => {
  const loggedUser = req.user;

  const weeks = Math.min(parseInt(req.query.weeks) || 8, 52);
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  try {
    const result = await Entry.aggregate([
      // Stage 1: filter to user + date window — uses compound index
      {
        $match: {
          createdBy: loggedUser._id,
          date: { $gte: since },
        },
      },
      // Stage 2: group by ISO year + ISO week number
      {
        $group: {
          _id: {
            isoWeekYear: { $isoWeekYear: "$date" },
            isoWeek: { $isoWeek: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      // Stage 3: sort chronologically
      {
        $sort: {
          "_id.isoWeekYear": 1,
          "_id.isoWeek": 1,
        },
      },
      // Stage 4: shape output — "2024-W03" label for Recharts
      {
        $project: {
          _id: 0,
          week: {
            $concat: [
              { $toString: "$_id.isoWeekYear" },
              "-W",
              {
                $cond: {
                  if: { $lt: ["$_id.isoWeek", 10] },
                  then: { $concat: ["0", { $toString: "$_id.isoWeek" }] },
                  else: { $toString: "$_id.isoWeek" },
                },
              },
            ],
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "Weekly analytics fetched successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching weekly analytics: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ------------------------------------------------------------------
// GET /api/entries/analytics/monthly?months=6
// Returns entry count grouped by calendar month for last N months.
// Default: last 6 months. Max: 24.
//
// Pipeline:
//   $match  → user's docs within the date window
//   $group  → by { year, month }, count entries
//   $sort   → ascending by year + month
//   $project → shape into { month: "Jan 2024", count }
//
// Example response:
// { data: [{ month: "Jan 2024", count: 8 }, { month: "Feb 2024", count: 12 }, ...] }
// ------------------------------------------------------------------
const getEntriesPerMonth = async (req, res) => {
  const loggedUser = req.user;

  const months = Math.min(parseInt(req.query.months) || 6, 24);
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // Month name lookup for readable labels
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  try {
    const result = await Entry.aggregate([
      // Stage 1: filter to user + date window — uses compound index
      {
        $match: {
          createdBy: loggedUser._id,
          date: { $gte: since },
        },
      },
      // Stage 2: group by calendar year + month
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      // Stage 3: sort chronologically
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      // Stage 4: shape output — "Jan 2024" label for Recharts
      {
        $project: {
          _id: 0,
          // month index is 1-based from MongoDB $month
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  MONTH_NAMES,
                  { $subtract: ["$_id.month", 1] },
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "Monthly analytics fetched successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching monthly analytics: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ------------------------------------------------------------------
// GET /api/entries/analytics/streak
// Calculates the current writing streak (consecutive days with entries)
// and the longest streak ever.
//
// Pipeline:
//   $match   → user's docs
//   $group   → deduplicate to one doc per calendar date
//   $sort    → descending by date
//   $project → normalize to YYYY-MM-DD strings
//
// Streak logic (JS, after aggregation):
//   Walk dates from today backwards.
//   Increment currentStreak while days are consecutive.
//   Stop when a gap is found.
//   Track longestStreak across the full history.
//
// Example response:
// { data: { currentStreak: 5, longestStreak: 14, totalDays: 42 } }
// ------------------------------------------------------------------
const getWritingStreak = async (req, res) => {
  const loggedUser = req.user;

  try {
    // Get one document per unique calendar date (UTC) the user wrote
    const result = await Entry.aggregate([
      // Stage 1: filter to this user
      { $match: { createdBy: loggedUser._id } },
      // Stage 2: normalize date to midnight UTC so time parts don't matter
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
        },
      },
      // Stage 3: sort newest first — makes streak walk straightforward
      { $sort: { _id: -1 } },
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        message: "Streak data fetched successfully!",
        data: { currentStreak: 0, longestStreak: 0, totalDays: 0 },
      });
    }

    // Extract sorted date strings
    const dates = result.map((r) => r._id); // ["2024-03-15", "2024-03-14", ...]

    // Helper: get YYYY-MM-DD string for any Date object
    const toDateStr = (d) => d.toISOString().slice(0, 10);

    // Helper: difference in calendar days between two YYYY-MM-DD strings
    const dayDiff = (a, b) => {
      const msPerDay = 86400000;
      return Math.round((new Date(a) - new Date(b)) / msPerDay);
    };

    const today = toDateStr(new Date());
    const yesterday = toDateStr(new Date(Date.now() - 86400000));

    // Current streak — walk backwards from today
    let currentStreak = 0;
    // Streak is active if the most recent entry is today or yesterday
    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        // Consecutive = exactly 1 day apart
        if (dayDiff(dates[i - 1], dates[i]) === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak — scan full history
    let longestStreak = 1;
    let runningStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) {
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        runningStreak = 1;
      }
    }

    res.status(200).json({
      message: "Streak data fetched successfully!",
      data: {
        currentStreak,
        longestStreak,
        totalDays: dates.length,
      },
    });
  } catch (error) {
    console.error("Error fetching writing streak: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
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
  getEntriesPerWeek,
  getEntriesPerMonth,
  getWritingStreak,
};