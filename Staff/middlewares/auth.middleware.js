const { verifyToken } = require('../utils/jwt');
const Staff = require('../../Admin/models/staff.model');
const config = require('../config/env.config');

/**
 * Middleware to authenticate Staff using JWT
 * Verifies token and attaches user info to req.user
 */
const authenticateStaff = async (req, res, next) => {
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

    // Verify role is STAFF
    if (decoded.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff role required',
      });
    }

    // Find Staff by ID
    const staff = await Staff.findById(decoded.userId);
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Verify role matches
    if (staff.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid role',
      });
    }

    // Verify staff is active
    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify branchId matches
    if (staff.branchId.toString() !== decoded.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Branch mismatch. Access denied',
      });
    }

    // Attach user info to request
    req.user = {
      id: staff._id.toString(),
      userId: staff._id.toString(),
      staffId: staff.staffId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      branchId: staff.branchId.toString(),
    };

    // Attach branchId for easy access
    req.branchId = staff.branchId.toString();

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Middleware to authorize specific roles
 * Must be used after authenticateStaff
 * Usage: authorizeRoles(['STAFF']) or authorizeRoles('STAFF', 'ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Flatten the allowedRoles array (handles both ['STAFF'] and 'STAFF' cases)
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateStaff,
  authorizeRoles,
};
