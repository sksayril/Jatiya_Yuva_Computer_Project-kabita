const { verifyToken } = require('../utils/jwt');
const Staff = require('../../Admin/models/staff.model');
const config = require('../config/env.config');

/**
 * Middleware to authenticate Teacher using JWT
 * Verifies token and attaches user info to req.user
 */
const authenticateTeacher = async (req, res, next) => {
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
    if (!decoded.userId || !decoded.role || !decoded.branchId || !decoded.teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Verify role is TEACHER
    if (decoded.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required',
      });
    }

    // Find Teacher by ID (Staff with role TEACHER)
    const teacher = await Staff.findById(decoded.userId);
    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Verify role matches
    if (teacher.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid role',
      });
    }

    // Verify teacher is active
    if (!teacher.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify branchId matches
    if (teacher.branchId.toString() !== decoded.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Branch mismatch. Access denied',
      });
    }

    // Verify teacherId matches
    if (teacher.staffId !== decoded.teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Teacher ID mismatch. Access denied',
      });
    }

    // Attach user info to request
    req.user = {
      id: teacher._id.toString(),
      userId: teacher._id.toString(),
      teacherId: teacher.staffId,
      name: teacher.name,
      email: teacher.email,
      role: 'TEACHER',
      branchId: teacher.branchId.toString(),
      assignedBatches: teacher.assignedBatches || [],
    };

    // Attach teacherId and branchId for easy access
    req.teacherId = teacher._id.toString();
    req.branchId = teacher.branchId.toString();
    req.assignedBatches = teacher.assignedBatches || [];

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
 * Must be used after authenticateTeacher
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateTeacher,
  authorizeRoles,
};
