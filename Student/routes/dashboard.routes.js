const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/summary',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getDashboardSummary
);

module.exports = router;
