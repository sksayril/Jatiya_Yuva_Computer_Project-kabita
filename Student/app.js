const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');
const path = require('path');

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

const app = express();

// Prepare for Mongoose strictQuery default change
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (no /api/student prefix - added by root app.js)
// Authentication
app.use('/', authRoutes);

// Dashboard
app.use('/dashboard', dashboardRoutes);

// Profile & ID Card
app.use('/profile', profileRoutes);

// Attendance
app.use('/attendance', attendanceRoutes);

// Fees
app.use('/fees', feesRoutes);

// Payments
app.use('/payments', paymentRoutes);

// Alerts
app.use('/alerts', alertsRoutes);

// Course & Batch
app.use('/course', courseRoutes);

// Classes
app.use('/classes', classRoutes);

// Exams
app.use('/exams', examRoutes);

// Results
app.use('/results', resultRoutes);

// Certificates
app.use('/certificates', certificateRoutes);

// Notices
app.use('/notices', noticeRoutes);

// Absence History
app.use('/absence-history', absenceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Panel Server is running',
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
