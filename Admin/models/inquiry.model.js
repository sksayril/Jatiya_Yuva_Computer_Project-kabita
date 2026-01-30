const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    courseInterest: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST'],
      default: 'NEW',
    },
    convertedToStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    notes: {
      type: String,
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

inquirySchema.index({ branchId: 1, status: 1 });
inquirySchema.index({ branchId: 1, source: 1 });
inquirySchema.index({ mobile: 1 });

// Check if model already exists to avoid overwrite error
const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
