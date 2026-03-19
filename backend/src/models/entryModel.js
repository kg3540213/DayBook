const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: { type: Date, required: true },
    title: String,
    mood: {
      type: String,
      enum: ["🙂", "😔", "😡", "😐"],
    },
    content: String,
  },
  { timestamps: true }
);

// ------------------------------------------------------------------
// TEXT INDEX
// Enables the $text operator for full-text search.
// title weight 2 → title matches rank higher than content matches.
// Only one text index is allowed per collection.
// ------------------------------------------------------------------
entrySchema.index(
  { title: "text", content: "text" },
  { weights: { title: 2, content: 1 }, name: "entry_text_index" }
);

// ------------------------------------------------------------------
// COMPOUND INDEX
// Optimises filter-only queries (mood + date range) and date sorting.
// Field order matters:
//   createdBy  → equality filter always present (narrows to user's docs)
//   date       → range filter + sort (-1 = descending by default)
//   mood       → equality filter applied after the range scan
// ------------------------------------------------------------------
entrySchema.index(
  { createdBy: 1, date: -1, mood: 1 },
  { name: "entry_filter_index" }
);

const entryModel = mongoose.model("Entry", entrySchema);

module.exports = entryModel;