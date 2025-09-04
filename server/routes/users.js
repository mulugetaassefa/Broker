const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  uploadIdentityDocument,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  createUser,
  updateUser
} = require('../controllers/userController');

// File upload configuration
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, getUserProfile);

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put(
  '/me',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('phone', 'Please include a valid phone number').matches(/^(\+251|0)?[79]\d{8}$/),
      check('gender', 'Please select a valid gender').optional().isIn(['male', 'female', 'other']),
      check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 })
    ]
  ],
  updateProfile
);

// @route   POST /api/users/me/avatar
// @desc    Upload profile picture
// @access  Private
router.post(
  '/me/avatar',
  [auth, upload.single('avatar')],
  uploadProfilePicture
);

// @route   POST /api/users/me/documents
// @desc    Upload identity document
// @access  Private
router.post(
  '/me/documents',
  [
    auth,
    upload.single('document'),
    [
      check('documentType', 'Document type is required').not().isEmpty(),
      check('documentNumber', 'Document number is required').not().isEmpty()
    ]
  ],
  uploadIdentityDocument
);

// Admin routes
// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', [auth, adminAuth], getUsers);

// @route   POST /api/users
// @desc    Create a user (admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    adminAuth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Valid email is required').isEmail(),
      check('phone', 'Please include a valid phone number').matches(/^(\+251|0)?[79]\d{8}$/),
      check('password', 'Password with 6+ chars is required').isLength({ min: 6 }),
      check('role').optional().isIn(['user', 'admin']),
      check('userType', 'User type is required').isIn(['seller', 'buyer', 'lessor', 'lessee']),
      check('isActive').optional().isBoolean()
    ]
  ],
  createUser
);

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', [auth, adminAuth], getUserById);

// @route   PUT /api/users/:id
// @desc    Update a user (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    adminAuth,
    [
      check('firstName').optional().not().isEmpty(),
      check('lastName').optional().not().isEmpty(),
      check('email').optional().isEmail(),
      check('phone').optional().matches(/^(\+251|0)?[79]\d{8}$/),
      check('password').optional().isLength({ min: 6 }),
      check('role').optional().isIn(['user', 'admin']),
      check('userType').optional().isIn(['seller', 'buyer', 'lessor', 'lessee']),
      check('isActive').optional().isBoolean()
    ]
  ],
  updateUser
);

// @route   PATCH /api/users/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.patch(
  '/:id/status',
  [auth, adminAuth],
  [
    check('isActive', 'Status is required').isBoolean()
  ],
  updateUserStatus
);

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin only)
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], deleteUser);

module.exports = router;