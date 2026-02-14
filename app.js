/**
 * Main Application Server
 * Single unified Express server with all module routers
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Database connection (must be imported first)
const connectDB = require('./db');

// Import routers from each module
const superAdminRouter = require('./SuperAdmin/app');
const adminRouter = require('./Admin/app');
const staffRouter = require('./Staff/app');
const studentRouter = require('./Student/app');
const teacherRouter = require('./Teacher/app');

// Public routes (no authentication required)
const certificatePublicRoutes = require('./SuperAdmin/routes/certificatePublic.routes');

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration - Allow all origins including localhost
const corsOptions = {
  origin: true, // Allow all origins (more reliable than '*')
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Increase body size limit to 50MB for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'SuperAdmin', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Admin', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Staff', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Student', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Teacher', 'uploads')));

// ============================================
// ROUTES
// ============================================

// Public Routes (no authentication)
app.use('/api/certificates', certificatePublicRoutes);

// Super Admin Routes
app.use('/api/super-admin', superAdminRouter);

// Admin Routes
app.use('/api/admin', adminRouter);

// Staff Routes
app.use('/api/staff', staffRouter);

// Student Routes
app.use('/api/student', studentRouter);

// Teacher Routes
app.use('/api/teacher', teacherRouter);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    services: {
      superAdmin: 'active',
      admin: 'active',
      staff: 'active',
      student: 'active',
      teacher: 'active',
    },
    database: {
      status: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
      name: require('mongoose').connection.name || 'N/A',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  // Handle payload too large error
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large. Maximum size is 50MB.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// SERVER INITIALIZATION
// ============================================

const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Unified Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV}`);
      console.log(`\n📋 Available Services:`);
      console.log(`   - Super Admin API: /api/super-admin/*`);
      console.log(`   - Admin Panel API: /api/admin/*`);
      console.log(`   - Staff Panel API: /api/staff/*`);
      console.log(`   - Student Panel API: /api/student/*`);
      console.log(`   - Teacher Panel API: /api/teacher/*`);
      console.log(`   - Health Check: /api/health`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
