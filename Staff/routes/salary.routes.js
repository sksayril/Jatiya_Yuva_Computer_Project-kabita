const express = require('express');
const router = express.Router();
const { getSalary } = require('../controllers/salary.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Get salary (read-only)
router.get(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getSalary
);

module.exports = router;
