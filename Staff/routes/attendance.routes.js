const express = require('express');
const router = express.Router();
const { markSelfAttendance, markStudentAttendance } = require('../controllers/attendance.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Staff self attendance (QR scan)
router.post(
  '/self',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  markSelfAttendance
);

// Mark student attendance (support role)
router.post(
  '/student',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  markStudentAttendance
);

module.exports = router;
