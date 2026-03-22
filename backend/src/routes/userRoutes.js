const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  viewProfile,
  updateProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
} = require("../controllers/userController");

router.get( "/me",          authMiddleware, viewProfile);
router.put( "/me",          authMiddleware, updateProfile);

// Profile photo — POST to upload, DELETE to remove
router.post(  "/me/photo",  authMiddleware, uploadProfilePhoto);
router.delete("/me/photo",  authMiddleware, deleteProfilePhoto);

module.exports = router;