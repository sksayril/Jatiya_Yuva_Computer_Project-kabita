const express = require('express');
const router = express.Router();
const { createInquiry, getInquiries, getInquiryById, updateInquiry, deleteInquiry, convertInquiry } = require('../controllers/inquiry.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createInquiry);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getInquiries);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getInquiryById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateInquiry);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteInquiry);
router.post('/:id/convert', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, convertInquiry);

module.exports = router;
