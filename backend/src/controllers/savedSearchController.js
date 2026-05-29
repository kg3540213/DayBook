const SavedSearch = require("../models/savedSearchModel");

const getSavedSearches = async (req, res) => {
  const loggedUser = req.user;
  try {
    const savedSearches = await SavedSearch.find({ createdBy: loggedUser._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Saved searches fetched successfully!",
      data: savedSearches,
    });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const createSavedSearch = async (req, res) => {
  const loggedUser = req.user;
  const { name, searchText, mood, dateFrom, dateTo, tags } = req.body;

  if (!name || !name.trim()) {
    return res.status(422).json({ message: "Folder name is required!" });
  }

  try {
    // Check if folder name already exists for this user to send a friendly message
    const existing = await SavedSearch.findOne({
      createdBy: loggedUser._id,
      name: name.trim(),
    });

    if (existing) {
      return res.status(422).json({ message: "A smart folder with this name already exists!" });
    }

    const savedSearch = await SavedSearch.create({
      createdBy: loggedUser._id,
      name: name.trim(),
      searchText: searchText || "",
      mood: mood || "",
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
      tags: tags || [],
    });

    res.status(201).json({
      message: "Smart folder saved successfully!",
      data: savedSearch,
    });
  } catch (error) {
    console.error("Error creating saved search:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

const deleteSavedSearch = async (req, res) => {
  const loggedUser = req.user;
  const { id } = req.params;

  try {
    const deleted = await SavedSearch.findOneAndDelete({
      _id: id,
      createdBy: loggedUser._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Smart folder not found or permissions denied!" });
    }

    res.status(200).json({
      message: "Smart folder deleted successfully!",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

module.exports = {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
};
