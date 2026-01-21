const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = Payment;

