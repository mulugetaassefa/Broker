const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const interestsRouter = require('./routes/interests');

const app = express();

// 1. CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const interestUploadsDir = path.join(uploadsDir, 'interests');

[uploadsDir, interestUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// 4. Serve uploaded files statically with enhanced error handling
const uploadsPath = path.join(__dirname, 'uploads');
const interestsUploadsPath = path.join(uploadsPath, 'interests');
console.log('Serving static files from:', uploadsPath);

// Ensure uploads directories exist
[uploadsPath, interestsUploadsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Simple static file server for uploads
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set cache control for images
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Fallback handler for uploads (for debugging)
app.use('/uploads', (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Normalize the path and handle potential directory traversal
  let normalizedPath = path.normalize(req.path).replace(/^(\/|\\)+/, '');
  
  // Try multiple possible locations for the file
  const possiblePaths = [
    path.join(uploadsPath, normalizedPath),
    path.join(interestsUploadsPath, normalizedPath.split('/').pop() || '')
  ];
  
  console.log(`[${new Date().toISOString()}] Request for file: ${req.path}`);
  console.log('Trying possible paths:', possiblePaths);
  
  // Helper function to try serving a file
  const tryServeFile = (filePath, index) => {
    if (index >= possiblePaths.length) {
      console.error(`[${new Date().toISOString()}] File not found in any location: ${normalizedPath}`);
      return res.status(404).json({ 
        success: false, 
        message: 'File not found',
        requestedPath: req.path,
        triedPaths: possiblePaths
      });
    }
    
    const currentPath = possiblePaths[index];
    const relativePath = path.relative(process.cwd(), currentPath);
    
    // Check if file exists and is accessible
    fs.access(currentPath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
      if (err) {
        console.log(`[${new Date().toISOString()}] File not found at: ${relativePath}`);
        return tryServeFile(null, index + 1);
      }
      
      // Check if it's a directory
      fs.stat(currentPath, (err, stats) => {
        if (err || stats.isDirectory()) {
          console.log(`[${new Date().toISOString()}] Path is a directory or error accessing: ${relativePath}`);
          return tryServeFile(null, index + 1);
        }
        
        // If we get here, we found the file
        console.log(`[${new Date().toISOString()}] Serving file from: ${relativePath}`);
        serveFile(currentPath, res);
      });
    });
  };
  
  // Helper function to serve a file with proper headers
  const serveFile = (filePath, res) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    // Set content type based on file extension
    if (mimeTypes[ext]) {
      res.set('Content-Type', mimeTypes[ext]);
    }
    
    // Set cache control for images
    if (mimeTypes[ext]) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Error streaming file: ${filePath}`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
    });
  };
  
  // Start trying to serve the file from possible locations
  tryServeFile(null, 0);
      
      // Set content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      if (mimeTypes[ext]) {
        res.set('Content-Type', mimeTypes[ext]);
        // Set cache control headers for images
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        // Allow cross-origin access
        res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        
        // Stream the file
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } else {
        // For non-image files, use the default static file serving
        express.static(uploadsPath)(req, res, next);
      }
      
      stream.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Error streaming file: ${relativePath}`, err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file' });
        }
      });
    });
  });
});

// 5. Request logging middleware
app.use((req, res, next) => {
  console.log(`\n--- New Request ---`);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('------------------\n');
  next();
});

// 6. Import routes
const interestRoutes = require('./routes/interests');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// 7. Mount routes
app.use('/api/interests', interestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 8. Health check and debug endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint to list files in uploads directory
app.get('/debug/uploads', (req, res, next) => {
  const listFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        listFiles(filePath, fileList);
      } else {
        fileList.push({
          name: file,
          path: filePath.replace(uploadsPath, '').replace(/\\/g, '/'),
          size: stat.size,
          modified: stat.mtime,
          url: `/uploads${filePath.replace(uploadsPath, '').replace(/\\/g, '/')}`
        });
      }
    });
    
    return fileList;
  };
  
  try {
    if (!fs.existsSync(uploadsPath)) {
      return res.status(404).json({
        success: false,
        message: 'Uploads directory not found',
        path: uploadsPath
      });
    }
    
    const files = listFiles(uploadsPath);
    
    res.json({
      success: true,
      uploadsPath,
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Error listing uploads:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing uploads',
      error: error.message
    });
  }
});

// 9. API Routes
app.use('/api/interests', interestsRouter);

// 10. 404 Handler
app.use((req, res) => {
  console.error(`404 - ${req.originalUrl} - ${req.method} - ${new Date().toISOString()}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 10. Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  res.status(err.status || 500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Press Ctrl+C to stop\n');
  
  // Log all available routes
  console.log('Available routes:');
  console.log(`- GET    /health`);
  console.log(`- GET    /api/interests/test`);
  console.log(`- GET    /api/interests/me`);
  console.log(`- POST   /api/interests`);
  console.log(`- GET    /api/interests/all`);
  console.log(`- GET    /api/auth/...`);
  console.log(`- GET    /api/users/...`);
  console.log('\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (for Docker/Heroku)
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated!');
  });
});
