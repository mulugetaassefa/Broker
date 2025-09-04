const Interest = require('../models/Interest');
const fs = require('fs');
const path = require('path');

// Submit new interest
const submitInterest = async (req, res) => {
  try {
    console.log('=== submitInterest called ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Parse request data
    let { type, transactionType, priceRange, notes, ...rest } = req.body;
    
    // Parse priceRange if it's a string
    let priceRangeObj;
    try {
      priceRangeObj = typeof priceRange === 'string' ? JSON.parse(priceRange) : priceRange;
    } catch (error) {
      console.error('Error parsing priceRange:', error);
      priceRangeObj = { min: 0, max: 0 };
    }
    
    // Process uploaded files
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

    // Prepare interest data
    const interestData = {
      user: req.user.id,
      type,
      transactionType,
      priceRange: {
        min: parseFloat(priceRangeObj?.min) || 0,
        max: parseFloat(priceRangeObj?.max) || 0,
        currency: 'ETB'
      },
      status: 'pending',
      images
    };

    // Add optional fields if they exist
    if (notes) interestData.notes = notes;
    
    // Add type-specific fields
    if (type === 'house') {
      interestData.houseDetails = {
        numRooms: parseInt(rest.numRooms) || 0,
        numBathrooms: parseInt(rest.numBathrooms) || 1,
        hasParking: rest.hasParking === 'true',
        hasGarden: rest.hasGarden === 'true'
      };
    } else if (type === 'car') {
      interestData.carDetails = {
        model: rest.carModel || '',
        year: parseInt(rest.carYear) || new Date().getFullYear(),
        mileage: parseInt(rest.mileage) || 0,
        transmission: rest.transmission || 'automatic',
        fuelType: rest.fuelType || 'petrol'
      };
    } else if (type === 'other') {
      interestData.otherDetails = {
        itemType: rest.itemType || '',
        condition: rest.condition || 'new',
        description: rest.description || ''
      };
    }

    // Create interest
    console.log('Creating interest with data:', JSON.stringify(interestData, null, 2));
    const interest = new Interest(interestData);
    
    try {
      await interest.save();
      console.log('Interest saved successfully:', interest._id);
    } catch (saveError) {
      console.error('Error saving interest to database:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', JSON.stringify(saveError.errors, null, 2));
      }
      throw saveError;
    }
    
    // Populate user details
    await interest.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Interest submitted successfully',
      data: interest
    });

  } catch (error) {
    console.error('Error in submitInterest:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit interest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's interests
const getMyInterests = async (req, res) => {
  try {
    console.log(`Fetching interests for user: ${req.user.id}`);
    
    const interests = await Interest.find({ user: req.user.id })
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt');
      
    console.log(`Found ${interests.length} interests for user ${req.user.id}`);
    
    res.json({ 
      success: true, 
      data: interests,
      count: interests.length
    });
  } catch (error) {
    console.error('Error getting interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update interest status (optionally with rejection reason)
const updateStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const update = { status };

    if (status === 'rejected') {
      update.rejectionReason = reason || null;
      update.rejectedAt = new Date();
    } else {
      // Clear previous rejection info if changing away from rejected
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
      message: 'Status updated',
      data: interest
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// Get all interests (admin only)
const getAllInterests = async (req, res) => {
  try {
    console.log('Fetching all interests');
    const interests = await Interest.find()
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt');
    
    console.log(`Found ${interests.length} interests`);
    res.json({
      success: true,
      data: interests,
      count: interests.length
    });
  } catch (error) {
    console.error('Error getting all interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all interests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete interest (owner or admin only)
const deleteInterest = async (req, res) => {
  try {
    // Fetch first to verify ownership/role
    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }

    // Ensure authenticated user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Authorization: owner or admin can delete
    const isOwner = interest.user?.toString?.() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this interest'
      });
    }

    // Perform deletion
    await Interest.findByIdAndDelete(req.params.id);

    // Delete associated images
    if (interest.images && interest.images.length > 0) {
      interest.images.forEach(image => {
        const filePath = path.join(__dirname, '..', image.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.json({
      success: true,
      message: 'Interest deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting interest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  submitInterest,
  getMyInterests,
  updateStatus,
  getAllInterests,
  deleteInterest
};
