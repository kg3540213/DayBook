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
    // content is stored as AES-encrypted ciphertext (plaintext for shared entries)
    content: String,

    // ── Rich text support ─────────────────────────────────────────
    // contentFormat: "plain" (legacy) | "html" (rich text, encrypted)
    contentFormat: {
      type:    String,
      enum:    ["plain", "html"],
      default: "plain",
    },

    // ── Tags ──────────────────────────────────────────────────────
    // Free-form string tags, max 10, each max 30 chars
    tags: {
      type:    [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message:   "Maximum 10 tags per entry.",
      },
    },

    // ── Pinned ────────────────────────────────────────────────────
    isPinned: {
      type:    Boolean,
      default: false,
    },

    // ── Template ──────────────────────────────────────────────────
    // Which template was used when creating this entry (for analytics)
    templateUsed: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

// ------------------------------------------------------------------
// TEXT INDEX — title + content for full-text search
// ------------------------------------------------------------------
entrySchema.index(
  { title: "text", content: "text" },
  { weights: { title: 2, content: 1 }, name: "entry_text_index" }
);

// ------------------------------------------------------------------
// COMPOUND INDEX — user + date + mood filter queries
// ------------------------------------------------------------------
entrySchema.index(
  { createdBy: 1, date: -1, mood: 1 },
  { name: "entry_filter_index" }
);

// ------------------------------------------------------------------
// TAGS INDEX — fast tag-based filtering
// ------------------------------------------------------------------
entrySchema.index({ createdBy: 1, tags: 1 }, { name: "entry_tags_index" });

// ------------------------------------------------------------------
// PINNED INDEX — fast pinned-first sorting
// ------------------------------------------------------------------
entrySchema.index({ createdBy: 1, isPinned: -1, date: -1 }, { name: "entry_pinned_index" });

const entryModel = mongoose.model("Entry", entrySchema);

module.exports = entryModel;