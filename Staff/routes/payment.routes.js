const express = require('express');
const router = express.Router();
const { createPayment, getPayments } = require('../controllers/payment.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Create payment (limited - no discount)
router.post(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  createPayment
);

// Get payments (by staff)
router.get(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getPayments
);

module.exports = router;
