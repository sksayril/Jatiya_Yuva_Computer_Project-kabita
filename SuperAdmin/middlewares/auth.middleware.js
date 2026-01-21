const { verifyToken } = require('../utils/jwt');
const SuperAdmin = require('../models/superAdmin.model');
const config = require('../config/env.config');

/**
 * Middleware to authenticate Super Admin using JWT
 * Verifies token and attaches user info to req.user
 */
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided or invalid format. Use: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Find SuperAdmin by ID from token
    const superAdmin = await SuperAdmin.findById(decoded.id);
    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Super Admin not found',
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled',
      });
    }

    // Verify role
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required',
      });
    }

    // Attach user info to request object
    req.user = {
      id: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles
 */
const authorizeRoles = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions',
    });
  }
  next();
};

module.exports = {
  authenticateSuperAdmin,
  authorizeRoles,
};

