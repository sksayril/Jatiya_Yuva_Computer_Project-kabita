const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const batchRoutes = require('./routes/batch.routes');
const examRoutes = require('./routes/exam.routes');
const recordedClassRoutes = require('./routes/recordedClass.routes');
const noticeRoutes = require('./routes/notice.routes');
const notificationRoutes = require('./routes/notification.routes');
const performanceRoutes = require('./routes/performance.routes');

const app = express();

// Prepare for Mongoose strictQuery default change
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (no /api/teacher prefix - added by root app.js)
// Authentication
app.use('/', authRoutes);

// Dashboard
app.use('/dashboard', dashboardRoutes);

// Attendance
app.use('/attendance', attendanceRoutes);

// Batches
app.use('/batches', batchRoutes);

// Exams & Marks
app.use('/exams', examRoutes);

// Recorded Classes
app.use('/recorded-classes', recordedClassRoutes);

// Notices
app.use('/notices', noticeRoutes);

// Notifications
app.use('/notifications', notificationRoutes);

// Performance
app.use('/performance', performanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
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
    error: config.isDevelopment() ? err.message : undefined,
  });
});

module.exports = app;
