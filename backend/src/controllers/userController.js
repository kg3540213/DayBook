const User = require("../models/userModel");
const cloudinary = require("../config/cloudinary");

// ── VIEW PROFILE ──────────────────────────────────────────────────
const viewProfile = (req, res) => {
  const { email, firstName, lastName, profilePhoto } = req.user;
  res.status(200).json({
    message: "Profile fetched successfully!",
    data: { email, firstName, lastName, profilePhoto },
  });
};

// ── UPDATE PROFILE (name only) ────────────────────────────────────
const updateProfile = async (req, res) => {
  const loggedUser = req.user;
  const { firstName, lastName } = req.body;

  if (!firstName) {
    return res.status(422).json({ message: "First name is required!" });
  }

  if (firstName.length > 50 || (lastName && lastName.length > 50)) {
    return res.status(422).json({
      message: "First Name and Last Name length should be less than 50!",
    });
  }

  try {
    const updateUser = await User.findByIdAndUpdate(
      loggedUser._id,
      { firstName, lastName },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      data: {
        firstName:    updateUser.firstName,
        lastName:     updateUser.lastName,
        profilePhoto: updateUser.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Something went wrong! Please try again later!",
    });
  }
};

// ── UPLOAD PROFILE PHOTO ──────────────────────────────────────────
// Expects the image as a base64 data URI in req.body.image.
// Uses Cloudinary's upload API — no multer/disk needed.
const uploadProfilePhoto = async (req, res) => {
  const loggedUser = req.user;
  const { image } = req.body; // base64 data URI: "data:image/jpeg;base64,..."

  if (!image) {
    return res.status(400).json({ message: "No image provided!" });
  }

  try {
    // Delete the old Cloudinary image if one exists
    if (loggedUser.profilePhotoPublicId) {
      await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);
    }

    // Upload new image — stored in the "daybook/profiles" folder
    const result = await cloudinary.uploader.upload(image, {
      folder:         "daybook/profiles",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Save the new URL and public_id to the user record
    const updatedUser = await User.findByIdAndUpdate(
      loggedUser._id,
      {
        profilePhoto:          result.secure_url,
        profilePhotoPublicId:  result.public_id,
      },
      { new: true }
    );

    res.status(200).json({
      message:      "Profile photo updated successfully!",
      profilePhoto: updatedUser.profilePhoto,
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({
      message: "Failed to upload photo. Please try again later!",
    });
  }
};

// ── DELETE PROFILE PHOTO ──────────────────────────────────────────
const deleteProfilePhoto = async (req, res) => {
  const loggedUser = req.user;

  if (!loggedUser.profilePhotoPublicId) {
    return res.status(400).json({ message: "No profile photo to delete!" });
  }

  try {
    // Remove from Cloudinary
    await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);

    // Clear from DB
    await User.findByIdAndUpdate(loggedUser._id, {
      profilePhoto:         null,
      profilePhotoPublicId: null,
    });

    res.status(200).json({ message: "Profile photo removed successfully!" });
  } catch (error) {
    console.error("Error deleting profile photo:", error);
    res.status(500).json({
      message: "Failed to remove photo. Please try again later!",
    });
  }
};

module.exports = { viewProfile, updateProfile, uploadProfilePhoto, deleteProfilePhoto };