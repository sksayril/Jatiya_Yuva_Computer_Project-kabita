const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Config imports
const superAdminConfig = require('./SuperAdmin/config/env.config');
const adminConfig = require('./Admin/config/env.config');
const staffConfig = require('./Staff/config/env.config');
const studentConfig = require('./Student/config/env.config');
const teacherConfig = require('./Teacher/config/env.config');

// App imports (unified)
const superAdminApp = require('./SuperAdmin/app');
const adminApp = require('./Admin/app');
const staffApp = require('./Staff/app');
const studentApp = require('./Student/app');
const teacherApp = require('./Teacher/app');

const app = express();

// Prepare for Mongoose strictQuery default change
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'SuperAdmin', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Admin', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Staff', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Teacher', 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    // Use SuperAdmin config for MongoDB (both use same database)
    await mongoose.connect(superAdminConfig.MONGODB_URI, {
      dbName: superAdminConfig.MONGODB_DB_NAME,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// ============================================
// SUPER ADMIN ROUTES
// ============================================
// Mount SuperAdmin App (unified)
app.use('/api/super-admin', superAdminApp);

// ============================================
// ADMIN ROUTES
// ============================================
// Mount Admin App (unified)
app.use('/api/admin', adminApp);

// ============================================
// STAFF ROUTES
// ============================================
// Mount Staff App (unified)
app.use('/api/staff', staffApp);

// ============================================
// STUDENT ROUTES
// ============================================
// Mount Student App (unified)
app.use('/api/student', studentApp);

// ============================================
// TEACHER ROUTES
// ============================================
// Mount Teacher App (unified)
app.use('/api/teacher', teacherApp);

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
  });
});

app.get('/api/super-admin/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Super Admin Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/admin/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Panel Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/staff/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff Panel Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/student/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Panel Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/teacher/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Teacher Panel Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: superAdminConfig.isDevelopment() ? err.message : undefined,
  });
});

// Server configuration - Use port 3000
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Unified Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${superAdminConfig.NODE_ENV}`);
  console.log(`\n📋 Available Services:`);
  console.log(`   - Super Admin API: /api/super-admin/*`);
  console.log(`   - Admin Panel API: /api/admin/*`);
  console.log(`   - Staff Panel API: /api/staff/*`);
  console.log(`   - Student Panel API: /api/student/*`);
  console.log(`   - Teacher Panel API: /api/teacher/*`);
  console.log(`   - Public Certificates: /api/certificates/*`);
  if (superAdminConfig.isDevelopment()) {
    console.log(`\n📋 Configuration:`, superAdminConfig.getAll());
  }
});

module.exports = app;
