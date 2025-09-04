const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Request = require('../models/Request');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedRequests,
      usersByType,
      requestsByType,
      currentInterests,
      previousMonthInterests
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'rejected' }),
      Request.countDocuments({ status: 'completed' }),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: '$userType', count: { $sum: 1 } } }
      ]),
      Request.aggregate([
        { $group: { _id: '$requestType', count: { $sum: 1 } } }
      ]),
      // Current month interests count
      User.countDocuments({ 
        role: 'user',
        createdAt: { $gte: currentMonthStart }
      }),
      // Previous month interests count
      User.countDocuments({ 
        role: 'user',
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      })
    ]);

    // Calculate total interests (sum of all user types)
    const totalInterests = usersByType.reduce((sum, type) => sum + (type.count || 0), 0);
    
    // Calculate percentage change from previous month
    const interestChange = previousMonthInterests > 0 
      ? ((currentInterests - previousMonthInterests) / previousMonthInterests) * 100 
      : 0;

    // Get recent requests
    const recentRequests = await Request.find()
      .populate('user', 'firstName lastName email phone userType')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get urgent requests
    const urgentRequests = await Request.find({ isUrgent: true, status: 'pending' })
      .populate('user', 'firstName lastName email phone userType')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      statistics: {
        totalUsers,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        completedRequests,
        totalInterests,
        interestChange: Math.round(interestChange * 10) / 10, // Round to 1 decimal place
        currentInterests,
        previousMonthInterests
      },
      usersByType,
      requestsByType,
      recentRequests,
      urgentRequests
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination and filters
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, userType, isActive, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'user' };
    if (userType) filter.userType = userType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details with their requests
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requests = await Request.find({ user: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      user,
      requests
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all requests with pagination and filters
router.get('/requests', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      requestType, 
      propertyType, 
      isUrgent,
      search 
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;
    if (propertyType) filter.propertyType = propertyType;
    if (isUrgent !== undefined) filter.isUrgent = isUrgent === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.subCity': { $regex: search, $options: 'i' } }
      ];
    }

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
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single request details
router.get('/requests/:id', adminAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('user', 'firstName lastName email phone userType');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ request });

  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status
router.put('/requests/:id/status', adminAuth, [
  body('status').isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status'),
  body('adminNotes').optional().trim().isLength({ max: 500 }).withMessage('Admin notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, adminNotes } = req.body;

    const updateData = { status };
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'firstName lastName email phone userType');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      message: 'Request status updated successfully',
      request
    });

  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete request (admin only)
router.delete('/requests/:id', adminAuth, async (req, res) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Request deleted successfully' });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statistics by date range
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      usersCount,
      requestsCount,
      requestsByStatus,
      requestsByType,
      usersByType
    ] = await Promise.all([
      User.countDocuments({ ...filter, role: 'user' }),
      Request.countDocuments(filter),
      Request.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Request.aggregate([
        { $match: filter },
        { $group: { _id: '$requestType', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { ...filter, role: 'user' } },
        { $group: { _id: '$userType', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      usersCount,
      requestsCount,
      requestsByStatus,
      requestsByType,
      usersByType
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 