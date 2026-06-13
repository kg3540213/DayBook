const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    searchText: {
      type: String,
      default: "",
    },
    mood: {
      type: String,
      default: "",
    },
    dateFrom: {
      type: String,
      default: "",
    },
    dateTo: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);


savedSearchSchema.index({ createdBy: 1, name: 1 }, { unique: true });

const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);

module.exports = SavedSearch;
