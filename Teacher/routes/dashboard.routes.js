const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

router.get(
  '/summary',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getDashboardSummary
);

module.exports = router;
