const express = require('express');
const router = express.Router();
const { createStaff, getStaff } = require('../controllers/staff.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createStaff);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaff);

module.exports = router;
