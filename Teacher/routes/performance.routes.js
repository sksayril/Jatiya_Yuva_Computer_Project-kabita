const express = require('express');
const router = express.Router();
const { getPerformance } = require('../controllers/performance.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getPerformance
);

module.exports = router;
