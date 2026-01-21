const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.get('/summary', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getDashboardSummary);

module.exports = router;
