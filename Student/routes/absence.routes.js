const express = require('express');
const router = express.Router();
const { getAbsenceHistory } = require('../controllers/absence.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getAbsenceHistory
);

module.exports = router;
