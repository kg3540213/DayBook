const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const entryController = require("../controllers/entryController");

router.use(authMiddleware);

router.post("/", entryController.createEntry);
router.get("/", entryController.getEntries);
router.get("/search", entryController.searchEntries);
router.get("/analytics", entryController.getMoodAnalytics);
router.get("/:id", entryController.getEntry);
router.patch("/:id", entryController.updateEntry);
router.delete("/:id", entryController.deleteEntry);

module.exports = router;
