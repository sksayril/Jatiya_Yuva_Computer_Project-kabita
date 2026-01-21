const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');
const path = require('path');

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

const app = express();

// Prepare for Mongoose strictQuery default change
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (no /api/staff prefix - added by root app.js)
// Authentication
app.use('/', authRoutes);

// Dashboard
app.use('/dashboard', dashboardRoutes);

// Attendance
app.use('/attendance', attendanceRoutes);

// Student Management
app.use('/students', studentRoutes);

// Follow-ups (includes absent-students endpoint)
app.use('/follow-ups', followUpRoutes);

// Absent students (alternative route for convenience - same as /follow-ups/absent-students)
app.use('/absent-students', (req, res, next) => {
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
app.use('/payments', paymentRoutes);

// Inquiries
app.use('/inquiries', inquiryRoutes);

// Salary
app.use('/salary', salaryRoutes);

// Reports
app.use('/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff Panel Server is running',
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
