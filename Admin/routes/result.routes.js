const express = require('express');
const router = express.Router();
const { createResult, getResults } = require('../controllers/result.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createResult);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getResults);

module.exports = router;
