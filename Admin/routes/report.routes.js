const express = require('express');
const router = express.Router();
const { getAttendanceReport, getFeesReport, getSalaryReport } = require('../controllers/report.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.get('/attendance', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getAttendanceReport);
router.get('/fees', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getFeesReport);
router.get('/salary', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getSalaryReport);

module.exports = router;
