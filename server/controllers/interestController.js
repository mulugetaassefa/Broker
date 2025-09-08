const Interest = require('../models/Interest');
const fs = require('fs');
const path = require('path');

// Submit new interest
const submitInterest = async (req, res) => {
  try {
    console.log('=== submitInterest called ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request headers:', req.headers);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Log complete request body with all fields
    console.log('Complete request body fields:');
    Object.keys(req.body).forEach(key => {
      console.log(`- ${key}:`, req.body[key]);
    });

    // Parse request data
    let requestData;
    
    // Check if data is sent as JSON in the 'data' field
    if (req.body.data) {
      try {
        requestData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      } catch (error) {
        console.error('Error parsing request data:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid request data format'
        });
      }
    } else {
      // Fallback to direct body parsing
      requestData = req.body;
    }
    
    const { type, transactionType, priceRange, notes, ...rest } = requestData;
    
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
      // Validate the interest before saving
      const validationError = interest.validateSync();
      if (validationError) {
        console.error('Validation error before save:', validationError);
        const errors = {};
        Object.keys(validationError.errors).forEach(key => {
          errors[key] = validationError.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors
        });
      }
      
      await interest.save();
      console.log('Interest saved successfully:', interest._id);
    } catch (saveError) {
      console.error('Error saving interest to database:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', JSON.stringify(saveError.errors, null, 2));
        const errors = {};
        Object.keys(saveError.errors).forEach(key => {
          errors[key] = saveError.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors
        });
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

// Update interest
const updateInterest = async (req, res) => {
  try {
    console.log('=== updateInterest called ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest ID'
      });
    }

    // Find the existing interest
    const existingInterest = await Interest.findById(id);
    if (!existingInterest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }

    // Check if the user is the owner or an admin
    if (existingInterest.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interest'
      });
    }

    // Parse request data
    let requestData;
    if (req.body.data) {
      try {
        requestData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      } catch (error) {
        console.error('Error parsing request data:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid request data format'
        });
      }
    } else {
      requestData = req.body;
    }

    const { type, transactionType, priceRange, notes, ...rest } = requestData;

    // Update the interest
    existingInterest.type = type || existingInterest.type;
    existingInterest.transactionType = transactionType || existingInterest.transactionType;
    existingInterest.notes = notes !== undefined ? notes : existingInterest.notes;

    // Update price range if provided
    if (priceRange) {
      existingInterest.priceRange = {
        min: priceRange.min || existingInterest.priceRange.min,
        max: priceRange.max || existingInterest.priceRange.max,
        currency: priceRange.currency || existingInterest.priceRange.currency || 'ETB'
      };
    }

    // Update type-specific fields
    if (type === 'house' && rest.houseDetails) {
      existingInterest.houseDetails = {
        ...existingInterest.houseDetails,
        ...rest.houseDetails
      };
    } else if (type === 'car' && rest.carDetails) {
      existingInterest.carDetails = {
        ...existingInterest.carDetails,
        ...rest.carDetails
      };
    } else if (type === 'other' && rest.otherDetails) {
      existingInterest.otherDetails = {
        ...existingInterest.otherDetails,
        ...rest.otherDetails
      };
    }

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        path: file.path.replace(/\\/g, '/'),
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
      existingInterest.images = [...existingInterest.images, ...newImages];
    }

    // Save the updated interest
    await existingInterest.save();
    
    // Populate user details
    await existingInterest.populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Interest updated successfully',
      data: existingInterest
    });

  } catch (error) {
    console.error('Error in updateInterest:', error);
    
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
      message: 'Failed to update interest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's interests
const getMyInterests = async (req, res) => {
  try {
    console.log(`Fetching interests for user: ${req.user.id}`);
    
    // Get base URL for image paths
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.API_BASE_URL || 'http://your-production-domain.com')
      : 'http://localhost:5000';
    
    const interests = await Interest.find({ user: req.user.id })
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt')
      .lean();
      
    console.log(`Found ${interests.length} interests for user ${req.user.id}`);
    
    // Process images to include full URLs
    const processedInterests = interests.map(interest => {
      // Create a copy of the interest to avoid modifying the original
      const processedInterest = { ...interest };
      
      // Ensure images is an array and process each image
      if (processedInterest.images && Array.isArray(processedInterest.images)) {
        processedInterest.images = processedInterest.images.map(img => {
          // Create a clean path that works in URLs
          const cleanPath = img.path.replace(/\\\\/g, '/').replace(/^.*?[\\/]uploads[\\/]/, '');
          
          return {
            ...img,
            path: cleanPath,
            url: `${baseUrl}/uploads/${cleanPath}`
          };
        });
      } else {
        processedInterest.images = [];
      }
      
      return processedInterest;
    });
    
    console.log('Processed interests with image URLs:', 
      processedInterests.map(i => ({
        _id: i._id,
        imageCount: i.images?.length || 0,
        firstImageUrl: i.images?.[0]?.url
      }))
    );
    
    res.json({ 
      success: true, 
      data: processedInterests,
      count: processedInterests.length
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

// Get all interests (admin only)
const getAllInterests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, sortBy = '-createdAt' } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortBy,
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      },
      lean: true
    };

    // Get base URL for image paths
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.API_BASE_URL || 'http://your-production-domain.com')
      : 'http://localhost:5000';

    // Get interests with pagination
    const result = await Interest.paginate(query, options);

    // Process images to include full URLs
    const processedDocs = result.docs.map(interest => {
      const processedInterest = { ...interest };
      if (processedInterest.images?.length) {
        processedInterest.images = processedInterest.images.map(img => ({
          ...img,
          path: img.path.replace(/\\\\/g, '/').replace(/^.*?[\\/]uploads[\\/]/, ''),
          url: `${baseUrl}/uploads/${img.path.replace(/\\\\/g, '/').replace(/^.*?[\\/]uploads[\\/]/, '')}`
        }));
      }
      return processedInterest;
    });

    res.json({
      success: true,
      data: processedDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      count: result.totalDocs
    });
  } catch (error) {
    console.error('Error getting all interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  submitInterest,
  getMyInterests,
  updateStatus,
  deleteInterest,
  getAllInterests,
  updateInterest
};
