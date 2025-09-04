const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('GET /api/interests2/test hit');
  res.json({ success: true, message: 'Test route in interests2 is working' });
});

// Simple POST route
router.post('/', (req, res) => {
  console.log('POST /api/interests2 hit');
  res.json({ success: true, message: 'POST route in interests2 is working' });
});

module.exports = router;
