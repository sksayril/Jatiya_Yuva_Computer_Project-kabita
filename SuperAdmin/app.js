/**
 * Super Admin Router
 * Exports Express router for mounting in main app.js
 * NO server initialization or MongoDB connection here
 */

const express = require('express');

// Route imports
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

// Create router (not app)
const router = express.Router();

// Routes (no /api/super-admin prefix - added by root app.js)
// Authentication
router.use('/', authRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Branch Management
router.use('/branches', branchRoutes);

// Branch Admin Management
router.use('/branch-admins', branchAdminRoutes);

// Finance
router.use('/finance', financeRoutes);

// Master Settings
router.use('/master', masterRoutes);

// Certificate Control
router.use('/certificates', certificateRoutes);

// Leads & Marketing
router.use('/leads', leadRoutes);

// System Settings
router.use('/system', systemRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Super Admin Panel is active',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint (development only) - helps diagnose JWT issues
router.get('/debug/jwt-config', (req, res) => {
  const config = require('./config/env.config');
  res.status(200).json({
    success: true,
    jwtConfig: {
      secretLength: config.JWT_SECRET ? config.JWT_SECRET.length : 0,
      secretSet: !!config.JWT_SECRET,
      expiresIn: config.JWT_EXPIRES_IN,
      envPath: require('path').join(__dirname, '..', '..', '.env'),
    },
    environment: config.NODE_ENV,
  });
});

module.exports = router;

