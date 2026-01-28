const express = require('express');
const router = express.Router();
const { createPayment, getPayments, getPaymentById, updatePayment, deletePayment } = require('../controllers/payment.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createPayment);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getPayments);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getPaymentById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updatePayment);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deletePayment);

module.exports = router;
