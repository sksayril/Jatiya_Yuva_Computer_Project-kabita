const Branch = require('../models/branch.model');

/**
 * Ensure branch is active (not locked or deleted)
 * Reads branchId from body, params, or user context.
 */
const ensureBranchActive = async (req, res, next) => {
  try {
    const branchId = req.body.branchId || req.params.branchId || req.user?.branchId;
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required',
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch || branch.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    if (branch.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Branch is locked. Operation not allowed',
      });
    }

    next();
  } catch (error) {
    console.error('Branch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during branch status check',
    });
  }
};

/**
 * Block all non-super-admin work when branch is locked.
 * Intended for student admission, attendance, payment, etc.
 */
const blockLockedBranch = async (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }
  return ensureBranchActive(req, res, next);
};

module.exports = {
  ensureBranchActive,
  blockLockedBranch,
};

