const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImages, deleteImage, uploadDocument } = require('../controllers/uploadController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpeg, .jpg, .png, and .webp files are allowed!'));
  }
});

// @route   POST /api/upload/images
// @desc    Upload multiple images
// @access  Private
router.post('/images', 
  protect, 
  upload.array('images', 5), // 'images' is the field name, max 5 files
  uploadImages
);

// @route   DELETE /api/upload/images/:publicId
// @desc    Delete an image
// @access  Private
router.delete('/images/:publicId', protect, deleteImage);

// @route   POST /api/upload/document
// @desc    Upload a document
// @access  Private
router.post('/document', protect, uploadDocument);

module.exports = router;
