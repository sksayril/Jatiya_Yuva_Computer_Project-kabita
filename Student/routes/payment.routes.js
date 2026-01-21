const express = require('express');
const router = express.Router();
const { createPayment, getPayments, downloadReceipt } = require('../controllers/payment.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

// Create online payment
router.post(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  createPayment
);

// Get payment history
router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getPayments
);

// Download receipt
router.get(
  '/:id/receipt',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  downloadReceipt
);

module.exports = router;
