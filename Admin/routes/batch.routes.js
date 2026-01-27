const express = require('express');
const router = express.Router();
const { createBatch, getBatches, getBatchById, updateBatch, deleteBatch, assignTeacherToBatch } = require('../controllers/batch.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createBatch);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getBatches);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getBatchById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateBatch);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteBatch);
router.post('/:id/assign-teacher', authenticateAdmin, authorizeRoles(['ADMIN', 'STAFF']), enforceBranchIsolation, assignTeacherToBatch);

module.exports = router;
