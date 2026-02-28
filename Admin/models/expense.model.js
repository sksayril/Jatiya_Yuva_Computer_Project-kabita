const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    billNumber: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of expense is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for performance
expenseSchema.index({ branchId: 1, createdAt: -1 });
expenseSchema.index({ createdBy: 1, createdAt: -1 });
expenseSchema.index({ branchId: 1, createdBy: 1, createdAt: -1 });

// Check if model already exists to avoid overwrite error
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

module.exports = Expense;
