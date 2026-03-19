const Entry = require("../models/entryModel");
const validator = require("validator");
const { analyzeMood } = require("../services/geminiService");

// ─── EXISTING ENDPOINTS (unchanged) ──────────────────────────────

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

// ── SEARCH ENTRIES ────────────────────────────────────────────────
// GET /api/entries/search
//
// Query parameters — all optional, but at least one must be supplied
// ─────────────────────────────────────────────────────────────────
// text      Keyword search across title (priority) + content.
//           Case-insensitive regex. Max 100 chars.
//
// mood      Exact emoji filter. One of: 🙂 😔 😡 😐
//
// dateFrom  Inclusive lower bound, YYYY-MM-DD.
// dateTo    Inclusive upper bound, YYYY-MM-DD.
//           dateTo is extended to 23:59:59.999 so the full day is
//           included. dateFrom must not be after dateTo.
//
// page      1-based page index. Defaults to 1.
// limit     Page size. Defaults to 10. Max 50.
//
// Response
// ────────
// {
//   message:    "...",
//   data:       [ ...entries ],          // same shape as getEntries
//   pagination: {
//     total:      <total matching docs>,
//     page:       <current page>,
//     limit:      <page size>,
//     totalPages: <ceil(total / limit)>
//   }
// }
//
// Index notes
// ───────────
// The compound index { createdBy: 1, date: -1, mood: 1 } covers every
// combination of user + date-range + mood filter.  The regex scan over
// title/content only runs on the already-narrowed document set.
// ------------------------------------------------------------------
const searchEntries = async (req, res) => {
  const loggedUser = req.user;

  // ── 1. Parse query params ────────────────────────────────────────
  const rawText     = req.query.text     ?? "";
  const rawMood     = req.query.mood     ?? "";
  const rawDateFrom = req.query.dateFrom ?? "";
  const rawDateTo   = req.query.dateTo   ?? "";

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  const hasText     = rawText.trim().length > 0;
  const hasMood     = rawMood.trim().length > 0;
  const hasDateFrom = rawDateFrom.trim().length > 0;
  const hasDateTo   = rawDateTo.trim().length > 0;

  // Require at least one filter — bare paginated dump belongs to GET /entries
  if (!hasText && !hasMood && !hasDateFrom && !hasDateTo) {
    return res.status(400).json({
      message: "Provide at least one filter: text, mood, dateFrom, or dateTo.",
    });
  }

  // ── 2. Validate each param ───────────────────────────────────────
  if (hasText && rawText.length > 100) {
    return res.status(422).json({ message: "Search text cannot exceed 100 characters!" });
  }

  const VALID_MOODS = ["🙂", "😔", "😡", "😐"];
  if (hasMood && !VALID_MOODS.includes(rawMood)) {
    return res.status(422).json({
      message: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}`,
    });
  }

  if (hasDateFrom && !validator.isDate(rawDateFrom)) {
    return res.status(422).json({ message: "dateFrom must be a valid date (YYYY-MM-DD)." });
  }
  if (hasDateTo && !validator.isDate(rawDateTo)) {
    return res.status(422).json({ message: "dateTo must be a valid date (YYYY-MM-DD)." });
  }
  if (hasDateFrom && hasDateTo && new Date(rawDateFrom) > new Date(rawDateTo)) {
    return res.status(422).json({ message: "dateFrom cannot be after dateTo." });
  }

  // ── 3. Build filter ──────────────────────────────────────────────
  // Always start with ownership so Mongo hits the compound index.
  const filter = { createdBy: loggedUser._id };

  if (hasMood) {
    filter.mood = rawMood;
  }

  if (hasDateFrom || hasDateTo) {
    filter.date = {};
    if (hasDateFrom) {
      filter.date.$gte = new Date(rawDateFrom);
    }
    if (hasDateTo) {
      // Push dateTo to end-of-day so the whole day is included
      const end = new Date(rawDateTo);
      end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (hasText) {
    // content is AES-encrypted in the database — regex against ciphertext
    // will never match a plaintext word like "happy".
    // Title is stored in plaintext so server-side regex works there.
    // Content keyword matching is done client-side in Entries.jsx after
    // decryption, using the same `searchText` value passed as `highlightText`.
    const escaped  = rawText.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex    = new RegExp(escaped, "i");
    filter.title   = { $regex: regex };
  }

  // ── 4. Execute count + find in parallel ─────────────────────────
  try {
    const [total, entries] = await Promise.all([
      Entry.countDocuments(filter),
      Entry.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      message: total === 0 ? "No entries found!" : "Entries fetched successfully!",
      data: entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching entries!", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── ANALYZE ENTRY MOOD (Gemini AI) ───────────────────────────────
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

// ─── ANALYTICS ENDPOINTS (unchanged) ─────────────────────────────

const getMoodAnalytics = async (req, res) => {
  const loggedUser = req.user;
  try {
    const moodCounts = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id } },
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

const getEntriesPerWeek = async (req, res) => {
  const loggedUser = req.user;
  const weeks = Math.min(parseInt(req.query.weeks) || 8, 52);
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  try {
    const result = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id, date: { $gte: since } } },
      {
        $group: {
          _id: {
            isoWeekYear: { $isoWeekYear: "$date" },
            isoWeek:     { $isoWeek: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.isoWeekYear": 1, "_id.isoWeek": 1 } },
      {
        $project: {
          _id: 0,
          week: {
            $concat: [
              { $toString: "$_id.isoWeekYear" },
              "-W",
              {
                $cond: {
                  if:   { $lt: ["$_id.isoWeek", 10] },
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

    res.status(200).json({ message: "Weekly analytics fetched successfully!", data: result });
  } catch (error) {
    console.error("Error fetching weekly analytics: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const getEntriesPerMonth = async (req, res) => {
  const loggedUser = req.user;
  const months = Math.min(parseInt(req.query.months) || 6, 24);
  const since  = new Date();
  since.setMonth(since.getMonth() - months);

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  try {
    const result = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id, date: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $arrayElemAt: [MONTH_NAMES, { $subtract: ["$_id.month", 1] }] },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({ message: "Monthly analytics fetched successfully!", data: result });
  } catch (error) {
    console.error("Error fetching monthly analytics: ", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const getWritingStreak = async (req, res) => {
  const loggedUser = req.user;
  try {
    const result = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      { $sort: { _id: -1 } },
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        message: "Streak data fetched successfully!",
        data: { currentStreak: 0, longestStreak: 0, totalDays: 0 },
      });
    }

    const dates     = result.map((r) => r._id);
    const toDateStr = (d) => d.toISOString().slice(0, 10);
    const dayDiff   = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);
    const today     = toDateStr(new Date());
    const yesterday = toDateStr(new Date(Date.now() - 86400000));

    let currentStreak = 0;
    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        if (dayDiff(dates[i - 1], dates[i]) === 1) currentStreak++;
        else break;
      }
    }

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
      data: { currentStreak, longestStreak, totalDays: dates.length },
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