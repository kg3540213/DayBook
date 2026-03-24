const mongoose = require("mongoose");

// ── SharedEntry ───────────────────────────────────────────────────
// An entry belonging to a SharedJournal.
// Content is stored in PLAINTEXT — both collaborators must be able
// to read it, and there is no shared-key encryption scheme yet.
// The UI clearly labels shared entries as "not encrypted".

const sharedEntrySchema = new mongoose.Schema(
  {
    journal: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "SharedJournal",
      required: true,
    },

    // The user (owner or collaborator) who wrote this entry
    author: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    date: {
      type:     Date,
      required: true,
    },

    title: {
      type:      String,
      required:  true,
      maxlength: 20,
    },

    mood: {
      type: String,
      enum: ["🙂", "😔", "😡", "😐"],
    },

    // PLAINTEXT — no AES encryption for shared entries
    content: {
      type:      String,
      required:  true,
      maxlength: 1500,
    },
  },
  { timestamps: true }
);

sharedEntrySchema.index({ journal: 1, date: -1 });
sharedEntrySchema.index({ author: 1 });

module.exports = mongoose.model("SharedEntry", sharedEntrySchema);