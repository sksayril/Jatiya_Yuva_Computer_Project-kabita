const Expense = require('../models/expense.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Create Expense
 * POST /api/admin/expenses
 * Admin can record their own expenses
 */
const createExpense = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { title, description, billNumber, purpose, amount, expenseDate } = req.body;

    // Validation
    if (!title || !purpose || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, purpose, amount',
      });
    }

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Create expense
    const expense = await Expense.create({
      branchId,
      createdBy: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      billNumber: billNumber ? billNumber.trim() : '',
      purpose: purpose.trim(),
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'CREATE',
      module: 'EXPENSE',
      entityId: expense._id,
      newData: {
        title: expense.title,
        purpose: expense.purpose,
        amount: expense.amount,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating expense',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get All Expenses
 * GET /api/admin/expenses
 * Get all expenses for the authenticated admin (branch isolation)
 */
const getExpenses = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build query
    const query = {
      branchId: branchObjectId,
      createdBy: userObjectId, // Only expenses created by this admin
    };

    // Date range filter
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.expenseDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get expenses with statistics
    const [expenses, total, statistics] = await Promise.all([
      Expense.find(query)
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Expense.countDocuments(query),
      Expense.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
          },
        },
        {
          $project: {
            _id: 0,
            totalExpenses: 1,
            totalAmount: 1,
            averageAmount: { $round: ['$averageAmount', 2] },
            minAmount: 1,
            maxAmount: 1,
          },
        },
      ]),
    ]);

    const stats = statistics[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        expenses,
        statistics: {
          totalExpenses: stats.totalExpenses,
          totalAmount: stats.totalAmount,
          averageAmount: stats.averageAmount,
          minAmount: stats.minAmount,
          maxAmount: stats.maxAmount,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Expense by ID
 * GET /api/admin/expenses/:id
 * Get a specific expense by ID (only if created by the admin)
 */
const getExpenseById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format',
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    }).lean();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Expense
 * POST /api/admin/expenses/:id/update
 * Update an expense (only if created by the admin)
 */
const updateExpense = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, billNumber, purpose, amount, expenseDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format',
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Store old data for audit
    const oldData = {
      title: expense.title,
      description: expense.description,
      billNumber: expense.billNumber,
      purpose: expense.purpose,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
    };

    // Update fields
    if (title) expense.title = title.trim();
    if (description !== undefined) expense.description = description.trim();
    if (billNumber !== undefined) expense.billNumber = billNumber.trim();
    if (purpose) expense.purpose = purpose.trim();
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }
      expense.amount = Number(amount);
    }
    if (expenseDate) expense.expenseDate = new Date(expenseDate);

    const updatedExpense = await expense.save();

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'UPDATE',
      module: 'EXPENSE',
      entityId: id,
      oldData,
      newData: {
        title: updatedExpense.title,
        description: updatedExpense.description,
        billNumber: updatedExpense.billNumber,
        purpose: updatedExpense.purpose,
        amount: updatedExpense.amount,
        expenseDate: updatedExpense.expenseDate,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Expense
 * POST /api/admin/expenses/:id/delete
 * Delete an expense (only if created by the admin)
 */
const deleteExpense = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format',
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Store data for audit
    const expenseData = {
      title: expense.title,
      purpose: expense.purpose,
      amount: expense.amount,
    };

    // Delete expense
    await Expense.findByIdAndDelete(id);

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'DELETE',
      module: 'EXPENSE',
      entityId: id,
      oldData: expenseData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
