/**
 * Admin Panel Router
 * Exports Express router for mounting in main app.js
 * NO server initialization or MongoDB connection here
 */

const express = require('express');

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

// Create router (not app)
const router = express.Router();

// Routes (no /api/admin prefix - added by root app.js)
// Authentication
router.use('/', authRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Student Management
router.use('/students', studentRoutes);

// Attendance
router.use('/attendance', attendanceRoutes);

// Payments
router.use('/payments', paymentRoutes);

// Courses
router.use('/courses', courseRoutes);

// Batches
router.use('/batches', batchRoutes);

// Staff/Teacher Management
router.use('/staff', staffRoutes);

// Exams
router.use('/exams', examRoutes);

// Results
router.use('/results', resultRoutes);

// Certificates
router.use('/certificates', certificateRoutes);

// Inquiries
router.use('/inquiries', inquiryRoutes);

// Recorded Classes
router.use('/recorded-classes', recordedClassRoutes);

// Reports
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Panel is active',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
