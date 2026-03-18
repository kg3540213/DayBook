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
      // Added 😐 as 4th mood option for neutral sentiment
      enum: ["🙂", "😔", "😡", "😐"],
    },
    content: String,
  },
  { timestamps: true }
);

const entryModel = mongoose.model("Entry", entrySchema);

module.exports = entryModel;