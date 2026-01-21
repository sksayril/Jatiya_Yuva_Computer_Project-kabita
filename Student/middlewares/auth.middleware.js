const { verifyToken } = require('../utils/jwt');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Middleware to authenticate Student using JWT
 * Verifies token and attaches user info to req.user
 */
const authenticateStudent = async (req, res, next) => {
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
    if (!decoded.userId || !decoded.role || !decoded.branchId || !decoded.studentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Verify role is STUDENT
    if (decoded.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required',
      });
    }

    // Find Student by ID
    const student = await Student.findById(decoded.userId);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Verify student is active
    if (student.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify branchId matches
    if (student.branchId.toString() !== decoded.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Branch mismatch. Access denied',
      });
    }

    // Verify studentId matches
    if (student.studentId !== decoded.studentId) {
      return res.status(403).json({
        success: false,
        message: 'Student ID mismatch. Access denied',
      });
    }

    // Attach user info to request
    req.user = {
      id: student._id.toString(),
      userId: student._id.toString(),
      studentId: student.studentId,
      name: student.studentName || student.name,
      email: student.email,
      role: 'STUDENT',
      branchId: student.branchId.toString(),
    };

    // Attach studentId and branchId for easy access
    req.studentId = student._id.toString();
    req.branchId = student.branchId.toString();

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
 * Must be used after authenticateStudent
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
  authenticateStudent,
  authorizeRoles,
};
