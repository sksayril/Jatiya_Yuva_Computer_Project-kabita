const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDashboard } = require('../controllers/dashboard.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.get('/summary', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getDashboardSummary);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getDashboard);

module.exports = router;
