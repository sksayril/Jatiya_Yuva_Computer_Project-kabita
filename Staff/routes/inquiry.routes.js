const express = require('express');
const router = express.Router();
const { createInquiry, getInquiries, updateInquiryFollowUp } = require('../controllers/inquiry.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Create inquiry
router.post(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  createInquiry
);

// Get inquiries
router.get(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getInquiries
);

// Update inquiry follow-up
router.patch(
  '/:id/follow-up',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  updateInquiryFollowUp
);

module.exports = router;
