const { verifyToken } = require('../utils/jwt');
const User = require('../../SuperAdmin/models/user.model');
const config = require('../config/env.config');

/**
 * Middleware to authenticate Admin using JWT
 * Verifies token and attaches user info to req.user
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided or invalid format. Use: Bearer <token>',
      });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Verify required payload fields
    if (!decoded.userId || !decoded.role || !decoded.branchId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Verify role is ADMIN
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
      });
    }

    // Find User by ID
    // Optimized User lookup: Only fetch essential fields for auth check
    const user = await User.findById(decoded.userId).select('role branchId isActive').lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Verify role matches
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
      });
    }

    // Verify branchId matches
    if (user.branchId.toString() !== decoded.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Branch mismatch. Access denied',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled',
      });
    }

    // Attach user info to request object
    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branchId.toString(),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // Don't call next() after sending error response
    return res.status(500).json({
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
  authenticateAdmin,
  authorizeRoles,
};
