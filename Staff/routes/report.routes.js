const express = require('express');
const router = express.Router();
const { getAttendanceReport, getFollowUpReport } = require('../controllers/report.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Get attendance report
router.get(
  '/attendance',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getAttendanceReport
);

// Get follow-up report
router.get(
  '/follow-ups',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getFollowUpReport
);

module.exports = router;
