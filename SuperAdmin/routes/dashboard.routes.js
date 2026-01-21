const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getDashboardGraphs,
} = require('../controllers/dashboard.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/summary', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getDashboardSummary);
router.get('/graphs', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getDashboardGraphs);

module.exports = router;

