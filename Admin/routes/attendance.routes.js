const express = require('express');
const router = express.Router();
const {
  markStudentAttendance,
  markStudentInTime,
  markStudentOutTime,
  markStaffAttendance,
  markStaffCheckIn,
  markStaffCheckOut,
  markTeacherAttendance,
  markTeacherCheckIn,
  markTeacherCheckOut,
  getStudentAttendance,
  getStaffAttendance,
  getTeacherAttendance,
  getAllAbsent,
  getStudentAttendanceById,
  updateStudentAttendance,
  deleteStudentAttendance,
  getStaffAttendanceById,
  updateStaffAttendance,
  deleteStaffAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
} = require('../controllers/attendance.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentAttendance);
router.post('/student/in-time', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentInTime);
router.post('/student/out-time', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStudentOutTime);
router.post('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffAttendance);
router.post('/staff/check-in', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffCheckIn);
router.post('/staff/check-out', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markStaffCheckOut);
// Teacher routes - more specific routes first
router.post('/teacher/check-in', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markTeacherCheckIn);
router.post('/teacher/check-out', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markTeacherCheckOut);
router.post('/teacher', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, markTeacherAttendance);
router.get('/absent', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getAllAbsent);
router.get('/student', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentAttendance);
router.get('/student/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentAttendanceById);
router.post('/student/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateStudentAttendance);
router.post('/student/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteStudentAttendance);
router.get('/staff', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffAttendance);
router.get('/teacher', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getTeacherAttendance);
router.post('/teacher/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateTeacherAttendance);
router.post('/teacher/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteTeacherAttendance);
router.get('/staff/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffAttendanceById);
router.post('/staff/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateStaffAttendance);
router.post('/staff/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteStaffAttendance);

module.exports = router;
