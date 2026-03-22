const cloudinary = require("cloudinary").v2;

// ------------------------------------------------------------------
// Cloudinary configuration
//
// Add to your backend .env:
//   CLOUDINARY_CLOUD_NAME=your_cloud_name
//   CLOUDINARY_API_KEY=your_api_key
//   CLOUDINARY_API_SECRET=your_api_secret
//
// Get these from: https://cloudinary.com → Dashboard → API Keys
// ------------------------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Validate config on startup so missing env vars are caught early
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY    ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "[Cloudinary] WARNING: One or more Cloudinary env vars are missing. " +
    "Profile photo upload will fail until they are set."
  );
}

module.exports = cloudinary;