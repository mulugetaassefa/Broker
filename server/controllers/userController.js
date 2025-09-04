const User = require('../models/User');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      bio: req.body.bio,
      'address.region': req.body.region,
      'address.subCity': req.body.subCity,
      'address.specificLocation': req.body.specificLocation
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/me/avatar
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ethiopian-broker/profiles',
      width: 300,
      height: 300,
      crop: 'fill'
    });

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({ 
      success: true, 
      message: 'Profile picture uploaded successfully',
      user 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload identity document
// @route   POST /api/users/me/documents
// @access  Private
exports.uploadIdentityDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a document' });
    }

    const { documentType, documentNumber, expiryDate } = req.body;
    
    if (!documentType || !documentNumber) {
      return res.status(400).json({ 
        message: 'Document type and number are required' 
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `ethiopian-broker/documents/${req.user._id}`,
      resource_type: 'auto'
    });

    const update = {};
    const now = new Date();

    if (documentType === 'nationalId') {
      update['identityDocuments.nationalId'] = {
        number: documentNumber,
        document: result.secure_url,
        verified: false,
        uploadedAt: now
      };
    } else if (documentType === 'passport') {
      update['identityDocuments.passport'] = {
        number: documentNumber,
        document: result.secure_url,
        expiryDate: expiryDate || null,
        verified: false,
        uploadedAt: now
      };
    } else {
      // For other document types
      update.$push = {
        'identityDocuments.otherDocuments': {
          name: documentType,
          document: result.secure_url,
          number: documentNumber,
          verified: false,
          uploadedAt: now
        }
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true }
    ).select('-password');

    res.json({ 
      success: true, 
      message: 'Document uploaded successfully',
      user 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Add role filter
    if (role) {
      query.role = role;
    }
    
    // Add status filter
    if (status !== '') {
      query.isActive = status === 'true';
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status (admin only)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Prevent deleting other admin accounts
    if (user.role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can delete admin accounts' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // TODO: Add cleanup for user's related data (properties, messages, etc.)
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password, role = 'user', userType, isActive = true } = req.body;

    // Ensure email and phone are unique
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone already in use' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      userType,
      isActive
    });

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    res.status(201).json({ message: 'User created successfully', user: sanitized });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = { ...req.body };

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modifying own role or deleting own active status via this endpoint
    const isSelf = user._id.toString() === req.user._id.toString();

    // Handle email/phone uniqueness if attempting to change them
    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({ email: updates.email });
      if (emailExists) return res.status(400).json({ message: 'Email already in use' });
    }
    if (updates.phone && updates.phone !== user.phone) {
      const phoneExists = await User.findOne({ phone: updates.phone });
      if (phoneExists) return res.status(400).json({ message: 'Phone already in use' });
    }

    // Only allow valid role transitions; do not allow demoting another admin unless requester is superadmin
    if (typeof updates.role !== 'undefined') {
      if (isSelf && updates.role !== user.role) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }
      if (user.role === 'admin' && req.user.role !== 'superadmin' && updates.role !== 'admin') {
        return res.status(403).json({ message: 'Only superadmin can change an admin\'s role' });
      }
    }

    // Apply updates field-by-field
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'role',
      'userType',
      'isActive',
      'address',
      'dateOfBirth',
      'gender',
      'bio'
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        // Prevent deactivating self
        if (field === 'isActive' && isSelf && updates.isActive === false) {
          return; // skip
        }
        user[field] = updates[field];
      }
    });

    // Handle password change explicitly so pre-save hook hashes it
    if (updates.password) {
      user.password = updates.password;
    }

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    res.json({ message: 'User updated successfully', user: sanitized });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
