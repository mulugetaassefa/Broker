const Property = require('../models/Property');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private
const createProperty = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    propertyType, 
    price, 
    location, 
    size, 
    bedrooms, 
    bathrooms, 
    features = [],
    contactInfo = {}
  } = req.body;

  // Get user from the authenticated request
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Create property
  const property = await Property.create({
    user: user._id,
    title,
    description,
    propertyType,
    price: {
      amount: price.amount,
      currency: price.currency || 'ETB',
      negotiable: price.negotiable || false
    },
    location: {
      city: location.city,
      subCity: location.subCity,
      address: location.address
    },
    size: {
      value: size.value,
      unit: size.unit || 'sqm'
    },
    bedrooms: bedrooms || 0,
    bathrooms: bathrooms || 0,
    features,
    contactInfo: {
      name: contactInfo.name || `${user.firstName} ${user.lastName}`,
      email: contactInfo.email || user.email,
      phone: contactInfo.phone || user.phone
    }
  });

  res.status(201).json({
    success: true,
    data: property
  });
});

// @desc    Get all properties (with filtering)
// @route   GET /api/properties
// @access  Public
const getProperties = asyncHandler(async (req, res) => {
  const { 
    status = 'approved', 
    propertyType, 
    city, 
    minPrice, 
    maxPrice,
    limit = 10,
    page = 1,
    myProperties = false 
  } = req.query;

  // Build query
  const query = {};
  
  // Only show approved properties to non-admins
  if (req.user?.role !== 'admin') {
    query.status = 'approved';
  } else if (status) {
    query.status = status;
  }

  // If myProperties is true and user is authenticated, filter by current user
  if (myProperties === 'true' && req.user) {
    query.user = req.user.id;
  }

  if (propertyType) query.propertyType = propertyType;
  if (city) query['location.city'] = new RegExp(city, 'i');
  
  if (minPrice || maxPrice) {
    query['price.amount'] = {};
    if (minPrice) query['price.amount'].$gte = Number(minPrice);
    if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
  }

  // Execute query with pagination
  const properties = await Property.find(query)
    .populate('userInfo', 'firstName lastName email phone')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Property.countDocuments(query);

  res.json({
    success: true,
    count: properties.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: properties
  });
});

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('userInfo', 'firstName lastName email phone');

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Increment view count
  property.views += 1;
  await property.save();

  res.json({
    success: true,
    data: property
  });
});

// @desc    Update property status (admin only)
// @route   PUT /api/properties/:id/status
// @access  Private/Admin
const updatePropertyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  
  property.status = status;
  await property.save();
  
  res.json({
    success: true,
    data: property
  });
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  
  // Check if user is the owner or admin
  if (property.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to delete this property');
  }
  
  await property.remove();
  
  res.json({
    success: true,
    data: {}
  });
});

// @desc    Get properties by user
// @route   GET /api/properties/user/:userId
// @access  Private
const getUserProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ user: req.params.userId })
    .sort({ createdAt: -1 });
    
  res.json({
    success: true,
    count: properties.length,
    data: properties
  });
});

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updatePropertyStatus,
  deleteProperty,
  getUserProperties
};
