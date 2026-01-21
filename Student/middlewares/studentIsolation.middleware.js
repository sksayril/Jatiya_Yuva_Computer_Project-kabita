const config = require('../config/env.config');

/**
 * Student Isolation Middleware
 * Ensures all queries are scoped to the authenticated student's own data
 * Must be used after authenticateStudent middleware
 */
const enforceStudentIsolation = (req, res, next) => {
  // Ensure req.user exists and has studentId
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Authentication required. Please login first.',
    });
  }

  if (!req.user.studentId || !req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Student context required. User must be a valid student.',
    });
  }

  // Attach studentId and branchId to request for use in controllers
  req.studentId = req.user.id; // MongoDB _id
  req.studentIdString = req.user.studentId; // Student ID string
  req.branchId = req.user.branchId;
  
  // If query params or body contain studentId, verify it matches
  if (req.query.studentId && req.query.studentId !== req.user.id && req.query.studentId !== req.user.studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.',
    });
  }

  if (req.body && req.body.studentId && req.body.studentId !== req.user.id && req.body.studentId !== req.user.studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.',
    });
  }

  // Override any studentId in body/query with authenticated studentId
  if (req.body) {
    req.body.studentId = req.user.id;
  }
  if (req.query.studentId) {
    req.query.studentId = req.user.id;
  }

  next();
};

/**
 * Helper function to add student filter to query
 */
const addStudentFilter = (query, studentId) => {
  if (!studentId) {
    throw new Error('Student ID is required for query filtering');
  }
  return { ...query, studentId };
};

module.exports = {
  enforceStudentIsolation,
  addStudentFilter,
};
