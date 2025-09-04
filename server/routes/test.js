const express = require('express');
const router = express.Router();

// Simple test route
router.get('/', (req, res) => {
  console.log('Test route hit!');
  res.json({ success: true, message: 'Test route is working' });
});

// Test POST route
router.post('/', (req, res) => {
  console.log('Test POST route hit!');
  res.json({ success: true, message: 'POST route is working' });
});

module.exports = router;
