const Entry    = require("../models/entryModel");
const validator = require("validator");
const { analyzeMood } = require("../services/geminiService");
const cache    = require("../config/cache");

// ─── CREATE ───────────────────────────────────────────────────────
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
      date, title, mood, content,
    });

    // Invalidate all cached data for this user so the next read is fresh
    await cache.invalidateUser(loggedUser._id);

    res.status(201).json({ message: "Entry added successfully!", saveEntry });
  } catch (error) {
    console.error("Error adding entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── GET ALL (with pagination + Redis cache) ──────────────────────
// GET /api/entries?page=1&limit=20
//
// Query params:
//   page   {number}  1-based page number.  Default: 1
//   limit  {number}  Results per page.      Default: 20, max 100
//
// Response:
// {
//   message: "...",
//   data:    [...entries],
//   pagination: { total, page, limit, totalPages }
// }
//
// Cache: results are stored in Redis for ENTRY_TTL seconds.
//        Key includes page + limit so different page sizes don't share
//        a stale cache entry.
// ------------------------------------------------------------------
const getEntries = async (req, res) => {
  const loggedUser = req.user;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const cacheKey = cache.keys.entries(loggedUser._id, page, limit);

  // ── 1. Try cache ─────────────────────────────────────────────────
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, fromCache: true });
  }

  // ── 2. Query DB ──────────────────────────────────────────────────
  try {
    const [total, entries] = await Promise.all([
      Entry.countDocuments({ createdBy: loggedUser._id }),
      Entry.find({ createdBy: loggedUser._id })
        .populate("createdBy", "firstName lastName")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const payload = {
      message: "Entries fetched successfully!",
      data: entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // ── 3. Store in cache ─────────────────────────────────────────
    await cache.set(cacheKey, payload, cache.ENTRY_TTL);

    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────
const getEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId    = req.params.id;
  try {
    const entry = await Entry.findOne({
      _id: entryId,
      createdBy: loggedUser._id,
    }).populate("createdBy", "firstName lastName");

    if (!entry)
      return res.status(404).json({ message: "Entry not found or does not belong to the logged-in user!" });

    res.status(200).json({ message: "Entry fetched successfully!", data: entry });
  } catch (error) {
    console.error("Error fetching entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────
const updateEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId    = req.params.id;
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

    await cache.invalidateUser(loggedUser._id);

    res.status(200).json({ message: "Entry updated successfully!", data: entry });
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────
const deleteEntry = async (req, res) => {
  const loggedUser = req.user;
  const entryId    = req.params.id;
  try {
    const entry = await Entry.findOneAndDelete({
      _id: entryId,
      createdBy: loggedUser._id,
    });
    if (!entry)
      return res.status(404).json({ message: "Entry not found or not deleted due to permissions!" });

    await cache.invalidateUser(loggedUser._id);

    res.status(200).json({ message: "Entry deleted successfully!", data: entry });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── SEARCH ───────────────────────────────────────────────────────
// (unchanged — search results are not cached because they depend on
//  arbitrary user-supplied filter combinations)
const searchEntries = async (req, res) => {
  const loggedUser = req.user;

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

  if (!hasText && !hasMood && !hasDateFrom && !hasDateTo)
    return res.status(400).json({
      message: "Provide at least one filter: text, mood, dateFrom, or dateTo.",
    });

  if (hasText && rawText.length > 100)
    return res.status(422).json({ message: "Search text cannot exceed 100 characters!" });

  const VALID_MOODS = ["🙂", "😔", "😡", "😐"];
  if (hasMood && !VALID_MOODS.includes(rawMood))
    return res.status(422).json({ message: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}` });

  if (hasDateFrom && !validator.isDate(rawDateFrom))
    return res.status(422).json({ message: "dateFrom must be a valid date (YYYY-MM-DD)." });
  if (hasDateTo && !validator.isDate(rawDateTo))
    return res.status(422).json({ message: "dateTo must be a valid date (YYYY-MM-DD)." });
  if (hasDateFrom && hasDateTo && new Date(rawDateFrom) > new Date(rawDateTo))
    return res.status(422).json({ message: "dateFrom cannot be after dateTo." });

  const filter = { createdBy: loggedUser._id };

  if (hasMood) filter.mood = rawMood;

  if (hasDateFrom || hasDateTo) {
    filter.date = {};
    if (hasDateFrom) filter.date.$gte = new Date(rawDateFrom);
    if (hasDateTo) {
      const end = new Date(rawDateTo);
      end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (hasText) {
    const escaped = rawText.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title  = { $regex: new RegExp(escaped, "i") };
  }

  try {
    const [total, entries] = await Promise.all([
      Entry.countDocuments(filter),
      Entry.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      message: total === 0 ? "No entries found!" : "Entries fetched successfully!",
      data: entries,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error searching entries:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── EXPORT ───────────────────────────────────────────────────────
// GET /api/entries/export?format=json   (default)
// GET /api/entries/export?format=csv
//
// Returns ALL of the user's entries (no pagination) so they can save
// a personal backup.  Content is still AES-encrypted — the server
// never stores or transmits plaintext.
//
// JSON response: standard { message, data } shape.
// CSV  response: Content-Disposition attachment, one row per entry.
// ------------------------------------------------------------------
const exportEntries = async (req, res) => {
  const loggedUser = req.user;
  const format     = (req.query.format ?? "json").toLowerCase();

  if (!["json", "csv"].includes(format))
    return res.status(422).json({ message: "format must be 'json' or 'csv'." });

  try {
    const entries = await Entry.find({ createdBy: loggedUser._id })
      .sort({ date: -1 })
      .lean(); // plain JS objects — faster for serialisation

    if (format === "csv") {
      // Build CSV manually — no extra package needed
      const escape = (val) => {
        if (val == null) return "";
        const str = String(val);
        // Wrap in double-quotes if it contains comma, newline, or quote
        return /[",\n]/.test(str)
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const headers = ["id", "date", "title", "mood", "content", "createdAt", "updatedAt"];
      const rows    = entries.map((e) => [
        escape(e._id),
        escape(e.date ? new Date(e.date).toISOString().slice(0, 10) : ""),
        escape(e.title),
        escape(e.mood),
        escape(e.content), // still encrypted — correct
        escape(e.createdAt ? new Date(e.createdAt).toISOString() : ""),
        escape(e.updatedAt ? new Date(e.updatedAt).toISOString() : ""),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="daybook-export-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }

    // JSON (default)
    res.status(200).json({
      message:    "Entries exported successfully!",
      total:      entries.length,
      exportedAt: new Date().toISOString(),
      data:       entries,
    });
  } catch (error) {
    console.error("Error exporting entries:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── AI MOOD ANALYSIS ────────────────────────────────────────────
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

// ─── ANALYTICS — MOOD (cached) ───────────────────────────────────
const getMoodAnalytics = async (req, res) => {
  const loggedUser = req.user;
  const cacheKey   = cache.keys.mood(loggedUser._id);

  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, fromCache: true });

  try {
    const moodCounts = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);

    const analytics = { "🙂": 0, "😔": 0, "😡": 0, "😐": 0 };
    moodCounts.forEach(({ _id, count }) => {
      if (_id in analytics) analytics[_id] = count;
    });

    const total   = Object.values(analytics).reduce((a, b) => a + b, 0);
    const payload = {
      message: "Mood analytics fetched successfully!",
      data:    { analytics, total },
    };

    await cache.set(cacheKey, payload, cache.ANALYTICS_TTL);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching mood analytics:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── ANALYTICS — WEEKLY (cached) ─────────────────────────────────
const getEntriesPerWeek = async (req, res) => {
  const loggedUser = req.user;
  const weeks      = Math.min(parseInt(req.query.weeks) || 8, 52);
  const cacheKey   = cache.keys.weekly(loggedUser._id, weeks);

  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, fromCache: true });

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

    const payload = { message: "Weekly analytics fetched successfully!", data: result };
    await cache.set(cacheKey, payload, cache.ANALYTICS_TTL);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching weekly analytics:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── ANALYTICS — MONTHLY (cached) ────────────────────────────────
const getEntriesPerMonth = async (req, res) => {
  const loggedUser = req.user;
  const months     = Math.min(parseInt(req.query.months) || 6, 24);
  const cacheKey   = cache.keys.monthly(loggedUser._id, months);

  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, fromCache: true });

  const since = new Date();
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

    const payload = { message: "Monthly analytics fetched successfully!", data: result };
    await cache.set(cacheKey, payload, cache.ANALYTICS_TTL);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching monthly analytics:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ─── ANALYTICS — STREAK (cached) ─────────────────────────────────
const getWritingStreak = async (req, res) => {
  const loggedUser = req.user;
  const cacheKey   = cache.keys.streak(loggedUser._id);

  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, fromCache: true });

  try {
    const result = await Entry.aggregate([
      { $match: { createdBy: loggedUser._id } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      { $sort: { _id: -1 } },
    ]);

    if (result.length === 0) {
      const payload = {
        message: "Streak data fetched successfully!",
        data: { currentStreak: 0, longestStreak: 0, totalDays: 0 },
      };
      await cache.set(cacheKey, payload, cache.ANALYTICS_TTL);
      return res.status(200).json(payload);
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

    let longestStreak = 1, runningStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) {
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        runningStreak = 1;
      }
    }

    const payload = {
      message: "Streak data fetched successfully!",
      data: { currentStreak, longestStreak, totalDays: dates.length },
    };
    await cache.set(cacheKey, payload, cache.ANALYTICS_TTL);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching writing streak:", error);
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
  exportEntries,
  analyzeEntry,
  getMoodAnalytics,
  getEntriesPerWeek,
  getEntriesPerMonth,
  getWritingStreak,
};