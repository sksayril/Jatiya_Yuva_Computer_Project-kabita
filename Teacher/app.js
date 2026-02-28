/**
 * Teacher Panel Router
 * Exports Express router for mounting in main app.js
 * NO server initialization or MongoDB connection here
 */

const express = require('express');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const profileRoutes = require('./routes/profile.routes');
const batchRoutes = require('./routes/batch.routes');
const examRoutes = require('./routes/exam.routes');
const recordedClassRoutes = require('./routes/recordedClass.routes');
const noticeRoutes = require('./routes/notice.routes');
const notificationRoutes = require('./routes/notification.routes');
const performanceRoutes = require('./routes/performance.routes');

// Create router (not app)
const router = express.Router();

// Routes (no /api/teacher prefix - added by root app.js)
// Authentication
router.use('/', authRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Attendance
router.use('/attendance', attendanceRoutes);

// Profile
router.use('/profile', profileRoutes);

// Batches
router.use('/batches', batchRoutes);

// Exams & Marks
router.use('/exams', examRoutes);

// Recorded Classes
router.use('/recorded-classes', recordedClassRoutes);

// Notices
router.use('/notices', noticeRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Performance
router.use('/performance', performanceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Teacher Panel is active',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
