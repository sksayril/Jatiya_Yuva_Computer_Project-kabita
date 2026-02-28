const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Create expense
router.post(
  '/',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  createExpense
);

// Get all expenses (for the authenticated admin)
router.get(
  '/',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  getExpenses
);

// Get expense by ID
router.get(
  '/:id',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  getExpenseById
);

// Update expense
router.post(
  '/:id/update',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  updateExpense
);

// Delete expense
router.post(
  '/:id/delete',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  deleteExpense
);

module.exports = router;
