const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { init: initSocket } = require('./socket');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messageRoutes');
const interestsRouter = require('./routes/interests');
const propertiesRouter = require('./routes/properties');
const testRouter = require('./routes/interests2');
const testRouter2 = require('./routes/test');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Make io available in request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security middleware
app.use(helmet());

// Rate limiting (production only)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
  console.log('Rate limiting enabled');
} else {
  // In development, disable limiter to avoid 429 while iterating
  console.log('Rate limiting disabled in development');
}
app.set('trust proxy', 1);

// CORS
console.log('Setting up CORS with NODE_ENV:', process.env.NODE_ENV);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://your-domain.com' // Replace with your production domain
    ];

    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, '..', 'server', 'uploads');
console.log('Serving static files from:', uploadsPath);

// Static files with CORS and cache control
app.use('/api/uploads', (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Continue to static file serving
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Set cache control for 1 year (immutable)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // Allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set content type based on file extension
    const ext = path.extname(path);
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())) {
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      res.setHeader('Content-Type', mimeTypes[ext.toLowerCase()] || 'application/octet-stream');
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interests', interestsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/test', testRouter2);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ethiopian Broker API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
}
);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    }
  );
  }
)
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
); 