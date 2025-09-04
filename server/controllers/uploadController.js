const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
const uploadImages = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files were uploaded' 
      });
    }

    // Limit number of files to 5
    if (req.files.length > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Maximum 5 files can be uploaded at once' 
      });
    }

    // Process each file
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve) => {
        if (!file.buffer) {
          console.error('File buffer is missing:', file.originalname);
          resolve(null);
          return;
        }

        const uniqueFilename = `interest_${uuidv4()}`;
        
        // Upload to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: uniqueFilename,
            folder: 'property_interests',
            format: 'webp',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              resolve(null);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                isPrimary: false
              });
            }
          }
        );

        // Check if file.buffer is a Buffer
        if (Buffer.isBuffer(file.buffer)) {
          uploadStream.end(file.buffer);
        } else {
          console.error('Invalid file buffer:', file.originalname);
          resolve(null);
        }
      });
    });

    const results = await Promise.all(uploadPromises);
    const uploadedImages = results.filter(result => result !== null);

    if (uploadedImages.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to upload any images' 
      });
    }

    // Set the first image as primary by default
    if (uploadedImages.length > 0) {
      uploadedImages[0].isPrimary = true;
    }

    res.json({ 
      success: true,
      message: 'Images uploaded successfully',
      data: { images: uploadedImages }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during file upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete an image
// @route   DELETE /api/upload/images/:publicId
// @access  Private
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false,
        message: 'Public ID is required' 
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ 
        success: true,
        message: 'Image deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Image not found or already deleted' 
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Document upload configuration
const path = require('path');
const fs = require('fs');

// Configure storage for documents
const storage = multer.memoryStorage();

// File filter for documents
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png, and .pdf files are allowed!'));
  }
};

// Initialize upload for documents
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('document');

// @desc    Upload a document
// @route   POST /api/upload/document
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      // Get the document type from the request body
      const { documentType = 'national_id', documentNumber = '' } = req.body;

      // In a real application, you would save this document reference to the user's profile
      const document = {
        documentType,
        documentNumber,
        documentImage: req.file.buffer,
        verified: false,
        uploadedAt: new Date()
      };

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during file upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  uploadImages,
  deleteImage,
  uploadDocument
};
