const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.get(
  '/summary',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getDashboardSummary
);

module.exports = router;
