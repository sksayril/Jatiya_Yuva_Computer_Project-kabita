const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const studentRoutes = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const paymentRoutes = require('./routes/payment.routes');
const courseRoutes = require('./routes/course.routes');
const batchRoutes = require('./routes/batch.routes');
const staffRoutes = require('./routes/staff.routes');
const examRoutes = require('./routes/exam.routes');
const resultRoutes = require('./routes/result.routes');
const certificateRoutes = require('./routes/certificate.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const recordedClassRoutes = require('./routes/recordedClass.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Prepare for Mongoose strictQuery default change
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME,
    });

    console.log('✅ Admin Panel MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Admin Panel MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
// Authentication
app.use('/api/admin', authRoutes);

// Dashboard
app.use('/api/admin/dashboard', dashboardRoutes);

// Student Management
app.use('/api/admin/students', studentRoutes);

// Attendance
app.use('/api/admin/attendance', attendanceRoutes);

// Payments
app.use('/api/admin/payments', paymentRoutes);

// Courses
app.use('/api/admin/courses', courseRoutes);

// Batches
app.use('/api/admin/batches', batchRoutes);

// Staff/Teacher Management
app.use('/api/admin/staff', staffRoutes);

// Exams
app.use('/api/admin/exams', examRoutes);

// Results
app.use('/api/admin/results', resultRoutes);

// Certificates
app.use('/api/admin/certificates', certificateRoutes);

// Inquiries
app.use('/api/admin/inquiries', inquiryRoutes);

// Recorded Classes
app.use('/api/admin/recorded-classes', recordedClassRoutes);

// Reports
app.use('/api/admin/reports', reportRoutes);

// Health check endpoint
app.get('/api/admin/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Panel Server is running',
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
    error: config.isDevelopment() ? err.message : undefined,
  });
});

// Server configuration
app.listen(config.PORT, () => {
  console.log(`🚀 Admin Panel Server is running on port ${config.PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
  if (config.isDevelopment()) {
    console.log('📋 Configuration:', config.getAll());
  }
});

module.exports = app;
