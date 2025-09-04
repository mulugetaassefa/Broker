const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('\n=== Auth Middleware ===');
    console.log('Request headers:', req.headers);
    
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Extracted token:', token ? '***' + token.slice(-8) : 'No token');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      const user = await User.findById(decoded.userId).select('-password');
      console.log('Found user:', user ? user._id : 'Not found');
      
      if (!user) {
        console.log('User not found for token');
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }

      if (!user.isActive) {
        console.log('User account is not active');
        return res.status(401).json({ message: 'Account is deactivated.' });
      }

      req.user = user;
      req.token = token;
      console.log('Authentication successful for user:', user._id);
      return next();
    } catch (jwtError) {
      console.error('JWT Error:', jwtError.name, jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired.' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    console.log('Admin auth check');
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        console.log('User is not an admin:', req.user._id);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      console.log('Admin access granted:', req.user._id);
      next();
    });
  } catch (error) {
    console.error('Admin Auth Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional auth: populate req.user if token provided and valid; otherwise continue
const maybeAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (e) {
      // Ignore invalid/expired token and proceed as unauthenticated
    }
    return next();
  } catch (error) {
    return next();
  }
};

module.exports = { auth, adminAuth, maybeAuth };