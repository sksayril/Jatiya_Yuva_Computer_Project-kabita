const express = require('express');
const router = express.Router();
const { getLiveClasses, getRecordedClasses } = require('../controllers/class.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

// Get live classes
router.get(
  '/live',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getLiveClasses
);

// Get recorded classes
router.get(
  '/recorded',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getRecordedClasses
);

module.exports = router;
