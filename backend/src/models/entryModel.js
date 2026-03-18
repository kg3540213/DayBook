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
      enum: ["🙂", "😔", "😡"],
    },
    content: String,
    // AI-detected mood from journal content analysis
    aiMood: {
      type: String,
      enum: ["happy", "sad", "stressed", "anxious", "calm", "excited", "angry", "neutral", null],
      default: null,
    },
    // Searchable keywords for encrypted content (stored unencrypted for search)
    searchableKeywords: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Text index for full-text search on searchableKeywords
entrySchema.index({ searchableKeywords: "text" });
// Compound index for user queries with date filtering
entrySchema.index({ createdBy: 1, date: -1 });
// Index for mood filtering
entrySchema.index({ createdBy: 1, aiMood: 1 });

const entryModel = mongoose.model("Entry", entrySchema);

module.exports = entryModel;
