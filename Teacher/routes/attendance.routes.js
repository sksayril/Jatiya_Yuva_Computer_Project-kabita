const express = require('express');
const router = express.Router();
const { markStudentAttendance, getMyAttendance, getMyAbsenceHistory } = require('../controllers/attendance.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

router.post(
  '/student',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  markStudentAttendance
);

router.get(
  '/my',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  getMyAttendance
);

router.get(
  '/absence-history',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  getMyAbsenceHistory
);

module.exports = router;
