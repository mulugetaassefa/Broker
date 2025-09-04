const express = require('express');
const router = express.Router();
const {
  createProperty,
  getProperties,
  getProperty,
  updatePropertyStatus,
  deleteProperty,
  getUserProperties
} = require('../controllers/propertyController');
const { auth: protect, adminAuth: authorize, maybeAuth } = require('../middleware/auth');

// Public routes with optional auth (so admin token is detected)
router.route('/')
  .get(maybeAuth, getProperties);

router.route('/:id')
  .get(maybeAuth, getProperty);

// Protected routes (require authentication)
router.use(protect);

router.route('/')
  .post(createProperty);

router.route('/user/:userId')
  .get(getUserProperties);

router.route('/:id')
  .delete(deleteProperty);

// Admin routes
router.use(authorize);

router.route('/:id/status')
  .put(updatePropertyStatus);

module.exports = router;
