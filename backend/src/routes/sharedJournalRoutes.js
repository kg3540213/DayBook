const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/sharedJournalController");

// ── Public (token-based) invite routes ────────────────────────────
// These still need auth (logged-in user) but the token is the main guard
router.get("/invite/:token", auth, ctrl.getInviteInfo);
router.post("/invite/:token/accept", auth, ctrl.acceptInvite);
router.post("/invite/:token/decline", auth, ctrl.declineInvite);

// ── Authenticated journal routes ──────────────────────────────────
router.get("/", auth, ctrl.getMySharedJournals);
router.post("/", auth, ctrl.createSharedJournal);
router.get("/:journalId", auth, ctrl.getSharedJournal);
router.delete("/:journalId", auth, ctrl.deleteSharedJournal);

// ── Entry routes (nested under journal) ──────────────────────────
router.post("/:journalId/entries", auth, ctrl.addSharedEntry);
router.patch("/entries/:entryId", auth, ctrl.updateSharedEntry);
router.delete("/entries/:entryId", auth, ctrl.deleteSharedEntry);

module.exports = router;
