const config = require('../config/env.config');

/**
 * Batch Isolation Middleware
 * Ensures teachers can only access their assigned batches
 * Must be used after authenticateTeacher middleware
 */
const enforceBatchIsolation = (req, res, next) => {
  // Ensure req.user exists and has assignedBatches
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Authentication required. Please login first.',
    });
  }

  if (!req.user.assignedBatches || req.user.assignedBatches.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'No batches assigned. Please contact administrator',
    });
  }

  // Attach assigned batches to request
  req.assignedBatches = req.user.assignedBatches;
  
  // If query params or body contain batchId, verify it's in assigned batches
  if (req.query.batchId) {
    const batchId = req.query.batchId.toString();
    const isAssigned = req.assignedBatches.some(
      (b) => b.toString() === batchId
    );
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Batch not assigned to you',
      });
    }
  }

  if (req.body && req.body.batchId) {
    const batchId = req.body.batchId.toString();
    const isAssigned = req.assignedBatches.some(
      (b) => b.toString() === batchId
    );
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Batch not assigned to you',
      });
    }
  }

  next();
};

/**
 * Helper function to verify batch is assigned to teacher
 */
const verifyBatchAssignment = (batchId, assignedBatches) => {
  if (!assignedBatches || assignedBatches.length === 0) {
    throw new Error('No batches assigned to teacher');
  }
  const isAssigned = assignedBatches.some(
    (b) => b.toString() === batchId.toString()
  );
  if (!isAssigned) {
    throw new Error('Batch not assigned to teacher');
  }
  return true;
};

module.exports = {
  enforceBatchIsolation,
  verifyBatchAssignment,
};
