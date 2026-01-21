/**
 * Staff Panel Router
 * Exports Express router for mounting in main app.js
 * NO server initialization or MongoDB connection here
 */

const express = require('express');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const studentRoutes = require('./routes/student.routes');
const followUpRoutes = require('./routes/followUp.routes');
const paymentRoutes = require('./routes/payment.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const salaryRoutes = require('./routes/salary.routes');
const reportRoutes = require('./routes/report.routes');

// Create router (not app)
const router = express.Router();

// Routes (no /api/staff prefix - added by root app.js)
// Authentication
router.use('/', authRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Attendance
router.use('/attendance', attendanceRoutes);

// Student Management
router.use('/students', studentRoutes);

// Follow-ups (includes absent-students endpoint)
router.use('/follow-ups', followUpRoutes);

// Absent students (alternative route for convenience - same as /follow-ups/absent-students)
router.use('/absent-students', (req, res, next) => {
  // Import and use the same controller
  const { getAbsentStudents } = require('./controllers/followUp.controller');
  const { authenticateStaff, authorizeRoles } = require('./middlewares/auth.middleware');
  const { enforceBranchIsolation } = require('./middlewares/branchIsolation.middleware');
  
  // Apply middlewares and call controller
  authenticateStaff(req, res, () => {
    authorizeRoles(['STAFF'])(req, res, () => {
      enforceBranchIsolation(req, res, () => {
        getAbsentStudents(req, res, next);
      });
    });
  });
});

// Payments
router.use('/payments', paymentRoutes);

// Inquiries
router.use('/inquiries', inquiryRoutes);

// Salary
router.use('/salary', salaryRoutes);

// Reports
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff Panel is active',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
