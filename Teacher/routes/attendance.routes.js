const express = require('express');
const router = express.Router();
const { markStudentAttendance } = require('../controllers/attendance.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

router.post(
  '/student',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  markStudentAttendance
);

module.exports = router;
