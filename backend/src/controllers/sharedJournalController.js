// backend/src/controllers/sharedJournalController.js
// Changes from original:
//   • import { emitEntryAdded, emitEntryUpdated, emitEntryDeleted }
//   • call the appropriate emitter at the end of the three entry mutations
//   • everything else is identical to the original file
// ─────────────────────────────────────────────────────────────────

const SharedJournal = require("../models/sharedJournalModel");
const SharedEntry   = require("../models/sharedEntryModel");
const User          = require("../models/userModel");
const crypto        = require("crypto");
const validator     = require("validator");
const { sendSharedJournalInviteEmail } = require("../services/EmailService");

// NEW — socket emitters
const {
  emitEntryAdded,
  emitEntryUpdated,
  emitEntryDeleted,
} = require("../socket/socketHandler");

// ── helpers ───────────────────────────────────────────────────────

const isMember = (journal, userId) => {
  const id = userId.toString();
  return (
    journal.owner.toString() === id ||
    (journal.collaborator && journal.collaborator.toString() === id)
  );
};

// ── CREATE JOURNAL ────────────────────────────────────────────────
const createSharedJournal = async (req, res) => {
  const loggedUser = req.user;
  const { name, description, inviteEmail } = req.body;

  if (!name || !name.trim())
    return res.status(422).json({ message: "Journal name is required!" });
  if (name.trim().length > 50)
    return res.status(422).json({ message: "Name cannot exceed 50 characters!" });
  if (description && description.length > 200)
    return res.status(422).json({ message: "Description cannot exceed 200 characters!" });

  if (!inviteEmail || !inviteEmail.trim())
    return res.status(422).json({ message: "Invite email is required!" });

  const email = inviteEmail.trim().toLowerCase();

  if (!validator.isEmail(email))
    return res.status(422).json({ message: "Invalid invite email format!" });
  if (email === loggedUser.email)
    return res.status(422).json({ message: "You cannot invite yourself!" });

  try {
    const invitee = await User.findOne({ email });

    if (invitee) {
      const existing = await SharedJournal.findOne({
        $or: [
          { owner: loggedUser._id, collaborator: invitee._id },
          { owner: invitee._id,    collaborator: loggedUser._id },
        ],
        status: { $in: ["pending", "active"] },
      });
      if (existing)
        return res.status(409).json({
          message: "A shared journal already exists between you two!",
        });
    }

    const inviteToken  = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const journal = await SharedJournal.create({
      name:          name.trim(),
      description:   description?.trim() || "",
      owner:         loggedUser._id,
      collaborator:  invitee?._id || null,
      inviteEmail:   email,
      inviteToken,
      inviteExpiry,
      status:        "pending",
    });

    await sendSharedJournalInviteEmail(
      email,
      loggedUser.firstName,
      name.trim(),
      inviteToken,
    );

    res.status(201).json({
      message: `Shared journal created! Invite sent to ${email}.`,
      data:    journal,
    });
  } catch (error) {
    console.error("Error creating shared journal:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── ACCEPT INVITE ─────────────────────────────────────────────────
const acceptInvite = async (req, res) => {
  const { token }  = req.params;
  const loggedUser = req.user;

  try {
    const journal = await SharedJournal.findOne({ inviteToken: token });

    if (!journal)
      return res.status(404).json({ message: "Invalid or expired invite link!" });
    if (journal.inviteExpiry < new Date())
      return res.status(400).json({ message: "This invite link has expired!" });
    if (journal.status === "active")
      return res.status(400).json({ message: "This journal is already active!" });
    if (journal.status === "declined")
      return res.status(400).json({ message: "This invite was already declined!" });

    if (loggedUser.email !== journal.inviteEmail)
      return res.status(403).json({
        message: `This invite was sent to ${journal.inviteEmail}. Please log in with that account.`,
      });

    journal.collaborator = loggedUser._id;
    journal.status       = "active";
    journal.inviteToken  = null;
    journal.inviteExpiry = null;
    await journal.save();

    res.status(200).json({
      message: "You've joined the shared journal!",
      data:    journal,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── DECLINE INVITE ────────────────────────────────────────────────
const declineInvite = async (req, res) => {
  const { token }  = req.params;
  const loggedUser = req.user;

  try {
    const journal = await SharedJournal.findOne({ inviteToken: token });

    if (!journal)
      return res.status(404).json({ message: "Invalid or expired invite link!" });
    if (loggedUser.email !== journal.inviteEmail)
      return res.status(403).json({ message: "This invite was not sent to your account." });

    journal.status       = "declined";
    journal.inviteToken  = null;
    journal.inviteExpiry = null;
    await journal.save();

    res.status(200).json({ message: "Invite declined." });
  } catch (error) {
    console.error("Error declining invite:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── GET MY SHARED JOURNALS ────────────────────────────────────────
const getMySharedJournals = async (req, res) => {
  const loggedUser = req.user;
  try {
    const journals = await SharedJournal.find({
      $or: [
        { owner: loggedUser._id },
        { collaborator: loggedUser._id },
        // Also show pending invites sent to this user's email
        { inviteEmail: loggedUser.email, status: "pending" },
      ],
    })
      .populate("owner",        "firstName lastName email profilePhoto")
      .populate("collaborator", "firstName lastName email profilePhoto")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Shared journals fetched successfully!",
      data: journals,
    });
  } catch (error) {
    console.error("Error fetching shared journals:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── GET SINGLE JOURNAL ────────────────────────────────────────────
const getSharedJournal = async (req, res) => {
  const loggedUser  = req.user;
  const { journalId } = req.params;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  try {
    const journal = await SharedJournal.findById(journalId)
      .populate("owner",        "firstName lastName email profilePhoto")
      .populate("collaborator", "firstName lastName email profilePhoto");

    if (!journal)
      return res.status(404).json({ message: "Shared journal not found!" });
    if (!isMember(journal, loggedUser._id))
      return res.status(403).json({ message: "You are not a member of this journal!" });
    if (journal.status !== "active")
      return res.status(403).json({ message: "This journal is not active yet!" });

    const [total, entries] = await Promise.all([
      SharedEntry.countDocuments({ journal: journalId }),
      SharedEntry.find({ journal: journalId })
        .populate("author", "firstName lastName profilePhoto")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      message: "Journal fetched successfully!",
      data:    { journal, entries },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching shared journal:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── DELETE / LEAVE JOURNAL ────────────────────────────────────────
const deleteSharedJournal = async (req, res) => {
  const loggedUser  = req.user;
  const { journalId } = req.params;

  try {
    const journal = await SharedJournal.findById(journalId);

    if (!journal)
      return res.status(404).json({ message: "Shared journal not found!" });
    if (!isMember(journal, loggedUser._id))
      return res.status(403).json({ message: "You are not a member of this journal!" });

    if (journal.owner.toString() === loggedUser._id.toString()) {
      await SharedEntry.deleteMany({ journal: journalId });
      await SharedJournal.findByIdAndDelete(journalId);
      return res.status(200).json({ message: "Shared journal deleted permanently." });
    }

    journal.collaborator = null;
    journal.status       = "pending";
    await journal.save();
    return res.status(200).json({ message: "You have left the shared journal." });
  } catch (error) {
    console.error("Error deleting shared journal:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── ADD SHARED ENTRY ──────────────────────────────────────────────
const addSharedEntry = async (req, res) => {
  const loggedUser  = req.user;
  const { journalId } = req.params;
  const { date, title, mood, content } = req.body;

  if (!title || !content || !mood)
    return res.status(422).json({ message: "Please fill all required fields!" });
  if (!validator.isDate(date))
    return res.status(422).json({ message: "Please provide a valid date!" });
  if (title.length > 20)
    return res.status(422).json({ message: "Title cannot exceed 20 characters!" });
  if (content.length > 1500)
    return res.status(422).json({ message: "Content cannot exceed 1500 characters!" });

  try {
    const journal = await SharedJournal.findById(journalId);

    if (!journal)
      return res.status(404).json({ message: "Shared journal not found!" });
    if (!isMember(journal, loggedUser._id))
      return res.status(403).json({ message: "You are not a member of this journal!" });
    if (journal.status !== "active")
      return res.status(403).json({ message: "This journal is not active yet!" });

    const entry = await SharedEntry.create({
      journal: journalId,
      author:  loggedUser._id,
      date, title, mood, content,
    });

    const populated = await SharedEntry.findById(entry._id).populate(
      "author", "firstName lastName profilePhoto"
    );

    await SharedJournal.findByIdAndUpdate(journalId, { updatedAt: new Date() });

    // ── SOCKET EMIT — notify all members in real time ─────────────
    emitEntryAdded(journalId, populated);

    res.status(201).json({
      message: "Entry added to shared journal!",
      data:    populated,
    });
  } catch (error) {
    console.error("Error adding shared entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── UPDATE SHARED ENTRY ───────────────────────────────────────────
const updateSharedEntry = async (req, res) => {
  const loggedUser = req.user;
  const { entryId } = req.params;
  const { date, title, mood, content } = req.body;

  if (!title || !content || !mood)
    return res.status(422).json({ message: "Please fill all required fields!" });
  if (!validator.isDate(date))
    return res.status(422).json({ message: "Please provide a valid date!" });
  if (title.length > 20)
    return res.status(422).json({ message: "Title cannot exceed 20 characters!" });
  if (content.length > 1500)
    return res.status(422).json({ message: "Content cannot exceed 1500 characters!" });

  try {
    const entry = await SharedEntry.findById(entryId).populate("journal");

    if (!entry)
      return res.status(404).json({ message: "Entry not found!" });

    if (entry.author.toString() !== loggedUser._id.toString())
      return res.status(403).json({ message: "You can only edit your own entries!" });

    entry.date    = date;
    entry.title   = title;
    entry.mood    = mood;
    entry.content = content;
    await entry.save();

    const populated = await SharedEntry.findById(entry._id).populate(
      "author", "firstName lastName profilePhoto"
    );

    // ── SOCKET EMIT ───────────────────────────────────────────────
    const journalId = entry.journal?._id?.toString() || entry.journal?.toString();
    emitEntryUpdated(journalId, populated);

    res.status(200).json({
      message: "Entry updated successfully!",
      data:    populated,
    });
  } catch (error) {
    console.error("Error updating shared entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── DELETE SHARED ENTRY ───────────────────────────────────────────
const deleteSharedEntry = async (req, res) => {
  const loggedUser = req.user;
  const { entryId } = req.params;

  try {
    const entry = await SharedEntry.findById(entryId).populate("journal");

    if (!entry)
      return res.status(404).json({ message: "Entry not found!" });

    const isAuthor = entry.author.toString() === loggedUser._id.toString();
    const isOwner  =
      entry.journal?.owner?.toString() === loggedUser._id.toString();

    if (!isAuthor && !isOwner)
      return res.status(403).json({
        message: "You don't have permission to delete this entry!",
      });

    const journalId = entry.journal?._id?.toString() || entry.journal?.toString();

    await SharedEntry.findByIdAndDelete(entryId);

    // ── SOCKET EMIT ───────────────────────────────────────────────
    emitEntryDeleted(journalId, entryId);

    res.status(200).json({ message: "Entry deleted successfully!" });
  } catch (error) {
    console.error("Error deleting shared entry:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

// ── GET INVITE INFO ───────────────────────────────────────────────
const getInviteInfo = async (req, res) => {
  const { token } = req.params;

  try {
    const journal = await SharedJournal.findOne({ inviteToken: token }).populate(
      "owner", "firstName lastName"
    );

    if (!journal)
      return res.status(404).json({ message: "Invalid or expired invite link!" });
    if (journal.inviteExpiry < new Date())
      return res.status(400).json({ message: "This invite link has expired!" });

    res.status(200).json({
      message: "Invite info fetched!",
      data: {
        journalName: journal.name,
        ownerName:   `${journal.owner.firstName} ${journal.owner.lastName || ""}`.trim(),
        inviteEmail: journal.inviteEmail,
        status:      journal.status,
      },
    });
  } catch (error) {
    console.error("Error fetching invite info:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later." });
  }
};

module.exports = {
  createSharedJournal,
  acceptInvite,
  declineInvite,
  getMySharedJournals,
  getSharedJournal,
  deleteSharedJournal,
  addSharedEntry,
  updateSharedEntry,
  deleteSharedEntry,
  getInviteInfo,
};