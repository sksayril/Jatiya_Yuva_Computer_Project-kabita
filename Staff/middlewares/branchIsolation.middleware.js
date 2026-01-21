const config = require('../config/env.config');

/**
 * Branch Isolation Middleware
 * Ensures all queries are scoped to the staff's branch
 * Must be used after authenticateStaff middleware
 */
const enforceBranchIsolation = (req, res, next) => {
  // Ensure req.user exists and has branchId
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Authentication required. Please login first.',
    });
  }

  if (!req.user.branchId) {
    return res.status(403).json({
      success: false,
      message: 'Branch context required. Staff must be assigned to a branch.',
    });
  }

  // Attach branchId to request for use in controllers
  req.branchId = req.user.branchId;
  
  // If query params or body contain branchId, verify it matches
  if (req.query.branchId && req.query.branchId !== req.user.branchId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Branch mismatch',
    });
  }

  if (req.body && req.body.branchId && req.body.branchId !== req.user.branchId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Branch mismatch',
    });
  }

  // Override any branchId in body/query with authenticated branchId
  if (req.body) {
    req.body.branchId = req.user.branchId;
  }
  if (req.query.branchId) {
    req.query.branchId = req.user.branchId;
  }

  next();
};

/**
 * Helper function to add branch filter to query
 */
const addBranchFilter = (query, branchId) => {
  if (!branchId) {
    throw new Error('Branch ID is required for query filtering');
  }
  return { ...query, branchId };
};

module.exports = {
  enforceBranchIsolation,
  addBranchFilter,
};
