const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
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
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'ONLINE'],
      required: [true, 'Payment mode is required'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    receiptPdfUrl: {
      type: String,
      trim: true,
    },
    month: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ branchId: 1, createdAt: -1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });
// receiptNumber already indexed via unique: true

// Check if model already exists to avoid overwrite error
// Force delete the cached model to ensure fresh schema
delete mongoose.models.Payment;
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
