const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const entryController = require("../controllers/entryController");

router.use(authMiddleware);

router.post("/", entryController.createEntry);
router.get("/", entryController.getEntries);

// ── Specific string routes MUST come before /:id ──────────────────
router.get("/search", entryController.searchEntries);
router.post("/analyze", entryController.analyzeEntry);
router.get("/tags", entryController.getUserTags);
router.get("/calendar", entryController.getCalendarData);

// Export — GET /api/entries/export?format=json|csv
router.get("/export", entryController.exportEntries);

// Analytics — all under /analytics/* namespace
router.get("/analytics/mood", entryController.getMoodAnalytics);
router.get("/analytics/weekly", entryController.getEntriesPerWeek);
router.get("/analytics/monthly", entryController.getEntriesPerMonth);
router.get("/analytics/streak", entryController.getWritingStreak);

// ── Param routes last ─────────────────────────────────────────────
router.get("/:id", entryController.getEntry);
router.patch("/:id", entryController.updateEntry);
router.patch("/:id/pin", entryController.togglePin);   // NEW: toggle pin
router.delete("/:id", entryController.deleteEntry);

module.exports = router;