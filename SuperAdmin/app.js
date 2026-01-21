const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const branchRoutes = require('./routes/branch.routes');
const branchAdminRoutes = require('./routes/branchAdmin.routes');
const financeRoutes = require('./routes/finance.routes');
const masterRoutes = require('./routes/master.routes');
const certificateRoutes = require('./routes/certificate.routes');
const certificatePublicRoutes = require('./routes/certificatePublic.routes');
const leadRoutes = require('./routes/lead.routes');
const systemRoutes = require('./routes/system.routes');
const config = require('./config/env.config');
const path = require('path');

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

    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
// Auth: POST /api/super-admin/signup | login
app.use('/api/super-admin', authRoutes);

// Super Admin Dashboard
app.use('/api/super-admin/dashboard', dashboardRoutes);

// Branch Management
app.use('/api/super-admin/branches', branchRoutes);

// Branch Admin Management
app.use('/api/super-admin/branch-admins', branchAdminRoutes);

// Finance
app.use('/api/super-admin/finance', financeRoutes);

// Master Settings
app.use('/api/super-admin/master', masterRoutes);

// Certificate Control
app.use('/api/certificates', certificatePublicRoutes);
app.use('/api/super-admin/certificates', certificateRoutes);

// Leads & Marketing
app.use('/api/super-admin/leads', leadRoutes);

// System Settings
app.use('/api/super-admin/system', systemRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
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
  console.log(`🚀 Server is running on port ${config.PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
  if (config.isDevelopment()) {
    console.log('📋 Configuration:', config.getAll());
  }
});

module.exports = app;

