const express = require('express');
const router = express.Router();
const { getFinanceOverview, exportFinance } = require('../controllers/finance.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/overview', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getFinanceOverview);
router.get('/export', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), exportFinance);

module.exports = router;

