const cloudinary = require("cloudinary").v2;

// ------------------------------------------------------------------
// Cloudinary configuration
//
// Add these to your backend .env file:
//   CLOUDINARY_CLOUD_NAME=your_cloud_name
//   CLOUDINARY_API_KEY=your_api_key
//   CLOUDINARY_API_SECRET=your_api_secret
//
// Get these from: https://cloudinary.com → Dashboard
// ------------------------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

module.exports = cloudinary;