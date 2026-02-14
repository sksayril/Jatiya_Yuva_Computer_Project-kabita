const express = require('express');
const router = express.Router();
const {
  markStudentAttendance,
  markStudentInTime,
  markStudentOutTime,
  markStaffAttendance,
  markStaffCheckIn,
  markStaffCheckOut,
  getStudentAttendance,
  getStaffAttendance,
  getStudentAttendanceById,
  updateStudentAttendance,
  deleteStudentAttendance,
  getStaffAttendanceById,
  updateStaffAttendance,
  deleteStaffAttendance,
} = require('../controllers/attendance.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentAttendance);
router.post('/student/in-time', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentInTime);
router.post('/student/out-time', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentOutTime);
router.post('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffAttendance);
router.post('/staff/check-in', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffCheckIn);
router.post('/staff/check-out', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffCheckOut);
router.get('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentAttendance);
router.get('/student/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentAttendanceById);
router.post('/student/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateStudentAttendance);
router.post('/student/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteStudentAttendance);
router.get('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffAttendance);
router.get('/staff/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffAttendanceById);
router.post('/staff/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateStaffAttendance);
router.post('/staff/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteStaffAttendance);

module.exports = router;
