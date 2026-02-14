const express = require('express');
const router = express.Router();
const { getAttendance, getMyAttendanceDetails } = require('../controllers/attendance.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getAttendance
);

router.get(
  '/details',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getMyAttendanceDetails
);

module.exports = router;
