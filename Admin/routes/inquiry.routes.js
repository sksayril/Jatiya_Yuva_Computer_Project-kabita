const express = require('express');
const router = express.Router();
const { createInquiry, getInquiries, convertInquiry } = require('../controllers/inquiry.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createInquiry);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getInquiries);
router.patch('/:id/convert', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, convertInquiry);

module.exports = router;
