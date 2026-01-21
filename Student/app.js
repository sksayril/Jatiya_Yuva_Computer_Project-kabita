/**
 * Student Panel Router
 * Exports Express router for mounting in main app.js
 * NO server initialization or MongoDB connection here
 */

const express = require('express');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const profileRoutes = require('./routes/profile.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const feesRoutes = require('./routes/fees.routes');
const paymentRoutes = require('./routes/payment.routes');
const alertsRoutes = require('./routes/alerts.routes');
const courseRoutes = require('./routes/course.routes');
const classRoutes = require('./routes/class.routes');
const examRoutes = require('./routes/exam.routes');
const resultRoutes = require('./routes/result.routes');
const certificateRoutes = require('./routes/certificate.routes');
const noticeRoutes = require('./routes/notice.routes');
const absenceRoutes = require('./routes/absence.routes');

// Create router (not app)
const router = express.Router();

// Routes (no /api/student prefix - added by root app.js)
// Authentication
router.use('/', authRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Profile & ID Card
router.use('/profile', profileRoutes);

// Attendance
router.use('/attendance', attendanceRoutes);

// Fees
router.use('/fees', feesRoutes);

// Payments
router.use('/payments', paymentRoutes);

// Alerts
router.use('/alerts', alertsRoutes);

// Course & Batch
router.use('/course', courseRoutes);

// Classes
router.use('/classes', classRoutes);

// Exams
router.use('/exams', examRoutes);

// Results
router.use('/results', resultRoutes);

// Certificates
router.use('/certificates', certificateRoutes);

// Notices
router.use('/notices', noticeRoutes);

// Absence History
router.use('/absence-history', absenceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Panel is active',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
