const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const Interest = require('../models/Interest');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../socket');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/interests';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

// Test route
router.get('/test', (req, res) => {
  console.log('GET /api/interests/test hit');
  res.json({ success: true, message: 'Test route is working' });
});

// Simple test endpoint to verify the route is working
router.get('/test-route', (req, res) => {
  console.log('Test route hit at', new Date().toISOString());
  res.json({
    success: true,
    message: 'Interests route is working',
    timestamp: new Date().toISOString()
  });
});

// Submit new interest
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  console.log('=== New Interest Submission ===');
  console.log('Request body:', req.body);
  console.log('Files uploaded:', req.files ? req.files.length : 0);
  
  try {
    // 1. Basic validation
    if (!req.body.type) {
      return res.status(400).json({
        success: false,
        message: 'Type is required'
      });
    }

    // 2. Validate required fields
    if (!req.body.transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type is required'
      });
    }

    // 3. Process price range with default values if not provided
    let priceRange = { min: 0, max: 0 };
    try {
      if (req.body.priceRange) {
        priceRange = typeof req.body.priceRange === 'string' 
          ? JSON.parse(req.body.priceRange)
          : req.body.priceRange;
      }
    } catch (error) {
      console.error('Error parsing price range:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid price range format'
      });
    }

    // 4. Process images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push({
          path: file.path.replace(/\\/g, '/'),
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }

    // 5. Prepare interest data with all required fields
    const interestData = {
      user: req.user._id,
      type: req.body.type,
      transactionType: req.body.transactionType,
      priceRange: {
        min: parseFloat(priceRange.min) || 0,
        max: parseFloat(priceRange.max) || 0,
        currency: 'ETB'
      },
      notes: req.body.notes || '',
      status: 'pending',
      images: images
    };

    // 6. Add type-specific details
    if (req.body.type === 'house') {
      interestData.houseDetails = {
        numRooms: parseInt(req.body.numRooms) || 1,
        numBathrooms: parseInt(req.body.numBathrooms) || 1,
        hasParking: req.body.hasParking === 'true',
        hasGarden: req.body.hasGarden === 'true'
      };
    } else if (req.body.type === 'car') {
      interestData.carDetails = {
        model: req.body.carModel || '',
        year: parseInt(req.body.carYear) || new Date().getFullYear(),
        mileage: parseInt(req.body.mileage) || 0,
        transmission: req.body.transmission || 'automatic',
        fuelType: req.body.fuelType || 'petrol'
      };
    } else if (req.body.type === 'other') {
      interestData.otherDetails = {
        itemType: req.body.itemType || 'Other',
        condition: req.body.condition || 'new',
        description: req.body.description || ''
      };
    }

    console.log('Creating interest with data:', JSON.stringify(interestData, null, 2));
    
    // 7. Save to database
    const interest = new Interest(interestData);
    const savedInterest = await interest.save();
    
    console.log('Interest saved successfully:', savedInterest._id);

    try {
      // 8. Find an admin to notify
      const admin = await User.findOne({ role: 'admin' });
      
      if (admin) {
        // Create a notification message
        const messageContent = `New interest submitted: ${savedInterest.type} (${savedInterest.transactionType})`;
        
        const conversationId = await Message.getConversationId(req.user._id, admin._id);
        
        const message = new Message({
          sender: req.user._id,
          receiver: admin._id,
          content: messageContent,
          conversationId,
          isAdminReply: false,
          isSystemMessage: true,
          interest: savedInterest._id
        });

        await message.save();
        
        // Emit socket event
        const io = getIO();
        if (io) {
          io.to(conversationId).emit('new_message', message);
          io.emit('new_interest', savedInterest);
        }
        
        console.log('Admin notification sent for interest:', savedInterest._id);
      }
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // 9. Send success response
    return res.status(201).json({
      success: true,
      message: 'Interest submitted successfully',
      data: savedInterest
    });

  } catch (error) {
    console.error('Error in interest submission:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Cleaned up file:', file.path);
          }
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry',
        field: error.keyValue ? Object.keys(error.keyValue)[0] : 'unknown'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to submit interest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user's interests with optional filtering
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching interests for user:', req.user.id);
    console.log('Query params:', req.query);
    
    // Build query object
    const query = { user: req.user.id };
    
    // Apply filters from query params
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.search) {
      query.$or = [
        { notes: { $regex: req.query.search, $options: 'i' } },
        { 'carDetails.model': { $regex: req.query.search, $options: 'i' } },
        { 'houseDetails.address': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const interests = await Interest.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone');
    
    console.log(`Found ${interests.length} interests for user ${req.user.id}`);
    
    res.json({
      success: true,
      count: interests.length,
      data: interests
    });
  } catch (error) {
    console.error('Error fetching user interests:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all interests with filters (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const { status, type, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Add filters
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Add search
    if (search) {
      query.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'user.phone': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { carModel: { $regex: search, $options: 'i' } },
        { itemType: { $regex: search, $options: 'i' } }
      ];
    }

    const interests = await Interest.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Interest.countDocuments(query);

    res.json({
      success: true,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      count,
      data: interests
    });
  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update interest status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update interest status'
      });
    }

    const { status, reason } = req.body;
    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const update = { status };
    if (status === 'rejected') {
      update.rejectionReason = reason || null;
      update.rejectedAt = new Date();
    } else {
      update.rejectionReason = null;
      update.rejectedAt = null;
    }

    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }

    res.json({
      success: true,
      message: 'Interest status updated successfully',
      data: interest
    });
  } catch (error) {
    console.error('Error updating interest status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interest status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete interest (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete interests'
      });
    }

    const interest = await Interest.findByIdAndDelete(req.params.id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }

    // Delete associated images
    if (interest.images && interest.images.length > 0) {
      interest.images.forEach(image => {
        try {
          if (fs.existsSync(image.path)) {
            fs.unlinkSync(image.path);
          }
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Interest deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting interest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
