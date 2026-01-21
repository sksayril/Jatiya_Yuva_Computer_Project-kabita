const express = require('express');
const router = express.Router();
const { getAttendance } = require('../controllers/attendance.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getAttendance
);

module.exports = router;
