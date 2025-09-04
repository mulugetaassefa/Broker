const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new request
router.post('/', auth, [
  body('requestType').isIn(['buy', 'sell', 'lease', 'rent']).withMessage('Invalid request type'),
  body('propertyType').isIn(['house', 'apartment', 'land', 'commercial', 'office', 'warehouse', 'other']).withMessage('Invalid property type'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.subCity').trim().notEmpty().withMessage('Sub-city is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('price.amount').isNumeric().withMessage('Price amount must be a number'),
  body('price.amount').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('propertyDetails.size').isNumeric().withMessage('Property size must be a number'),
  body('propertyDetails.size').isFloat({ min: 0 }).withMessage('Property size cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const requestData = {
      ...req.body,
      user: req.user._id
    };

    const newRequest = new Request(requestData);
    await newRequest.save();

    // Populate user info
    await newRequest.populate('user', 'firstName lastName email phone userType');

    res.status(201).json({
      message: 'Request submitted successfully',
      request: newRequest
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, requestType } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;

    const requests = await Request.find(filter)
      .populate('user', 'firstName lastName email phone userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single request by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('user', 'firstName lastName email phone userType');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user owns this request or is admin
    if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ request });

  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('price.amount').optional().isNumeric().withMessage('Price amount must be a number'),
  body('price.amount').optional().isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('isUrgent').optional().isBoolean().withMessage('isUrgent must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update request that is not pending' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone userType');

    res.json({
      message: 'Request updated successfully',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete request
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow deletion if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete request that is not pending' });
    }

    await Request.findByIdAndDelete(req.params.id);

    res.json({ message: 'Request deleted successfully' });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload images for request
router.post('/:id/images', auth, async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Images are required' });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In a real implementation, you would:
    // 1. Save images to file system or cloud storage
    // 2. Add the file paths to the request.images array
    
    const imageData = images.map(image => ({
      filename: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
      path: image, // This should be the actual file path/URL
      uploadedAt: new Date()
    }));

    request.images.push(...imageData);
    await request.save();

    res.json({
      message: 'Images uploaded successfully',
      request
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 