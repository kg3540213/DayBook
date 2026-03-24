const User      = require("../models/userModel");
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

  if (!firstName)
    return res.status(422).json({ message: "First name is required!" });

  if (firstName.length > 50 || (lastName && lastName.length > 50))
    return res.status(422).json({
      message: "First Name and Last Name length should be less than 50!",
    });

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
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};


const uploadProfilePhoto = async (req, res) => {
  const loggedUser = req.user;
  const { image }  = req.body;

  if (!image)
    return res.status(400).json({ message: "No image provided!" });

  // Basic sanity check — must look like a data URI
  if (!image.startsWith("data:image/"))
    return res.status(422).json({ message: "Invalid image format. Please upload a JPG, PNG, WEBP, or GIF." });

  try {
    // Delete previous Cloudinary image to avoid orphaned files
    if (loggedUser.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);
      } catch (destroyErr) {
        // Non-fatal — log it but continue with the upload
        console.warn("[Cloudinary] Could not delete old photo:", destroyErr.message);
      }
    }

    const result = await cloudinary.uploader.upload(image, {
      folder:         "daybook/profiles",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      resource_type: "image",
    });

    if (!result || !result.secure_url) {
      throw new Error("Cloudinary upload returned an empty response.");
    }

    // Persist URL + public_id in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      loggedUser._id,
      {
        profilePhoto:         result.secure_url,
        profilePhotoPublicId: result.public_id,
      },
      // return the updated document instead of the old one.
      { new: true }
    );

    res.status(200).json({
      message:      "Profile photo updated successfully!",
      profilePhoto: updatedUser.profilePhoto,
    });
  } catch (error) {
    console.error("[uploadProfilePhoto] Error:", error);

    // Surface a clear message for common Cloudinary auth errors
    if (error.message?.includes("Invalid Signature") || error.http_code === 401) {
      return res.status(500).json({
        message: "Cloudinary authentication failed. Check your API credentials in .env.",
      });
    }

    res.status(500).json({
      message: "Failed to upload photo. Please try again later!",
    });
  }
};

// ── DELETE PROFILE PHOTO ──────────────────────────────────────────
const deleteProfilePhoto = async (req, res) => {
  const loggedUser = req.user;

  if (!loggedUser.profilePhotoPublicId)
    return res.status(400).json({ message: "No profile photo to delete!" });

  try {
    await cloudinary.uploader.destroy(loggedUser.profilePhotoPublicId);

    await User.findByIdAndUpdate(loggedUser._id, {
      profilePhoto:         null,
      profilePhotoPublicId: null,
    });

    res.status(200).json({ message: "Profile photo removed successfully!" });
  } catch (error) {
    console.error("[deleteProfilePhoto] Error:", error);
    res.status(500).json({ message: "Failed to remove photo. Please try again later!" });
  }
};

module.exports = { viewProfile, updateProfile, uploadProfilePhoto, deleteProfilePhoto };