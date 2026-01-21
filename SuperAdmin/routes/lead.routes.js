const express = require('express');
const router = express.Router();
const { getLeads, getLeadAnalytics } = require('../controllers/lead.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getLeads);
router.get('/analytics', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getLeadAnalytics);

module.exports = router;

