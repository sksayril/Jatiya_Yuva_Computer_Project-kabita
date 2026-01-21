const express = require('express');
const router = express.Router();
const { createBatch, getBatches, updateBatch } = require('../controllers/batch.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createBatch);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getBatches);
router.patch('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateBatch);

module.exports = router;
