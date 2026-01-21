const express = require('express');
const router = express.Router();
const {
  markStudentAttendance,
  markStaffAttendance,
  getStudentAttendance,
  getStaffAttendance,
} = require('../controllers/attendance.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentAttendance);
router.post('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffAttendance);
router.get('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentAttendance);
router.get('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffAttendance);

module.exports = router;
