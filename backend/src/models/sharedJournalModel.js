const mongoose = require("mongoose");

// ── SharedJournal ─────────────────────────────────────────────────
// A journal space that two verified LPU users can both read & write.
// Entries inside are NOT AES-encrypted (shared key problem) — a clear
// UI label informs users of this. Private journals remain encrypted.

const sharedJournalSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 50,
    },

    // The user who created the journal and sent the invite
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // The invited collaborator — null until they accept
    collaborator: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },

    // Email the invite was sent to (before they accept / if no account yet)
    inviteEmail: {
      type:    String,
      default: null,
    },

    // pending → collaborator hasn't accepted yet
    // active  → both users are in
    // declined → collaborator rejected the invite
    status: {
      type:    String,
      enum:    ["pending", "active", "declined"],
      default: "pending",
    },

    // Random token e-mailed to the invitee — single-use, expires in 7 days
    inviteToken:  { type: String,  default: null },
    inviteExpiry: { type: Date,    default: null },

    description: {
      type:     String,
      maxlength: 200,
      default:  "",
    },
  },
  { timestamps: true }
);

// Compound index — quickly find all journals a user is part of
sharedJournalSchema.index({ owner: 1 });
sharedJournalSchema.index({ collaborator: 1 });
sharedJournalSchema.index({ inviteToken: 1 });

module.exports = mongoose.model("SharedJournal", sharedJournalSchema);