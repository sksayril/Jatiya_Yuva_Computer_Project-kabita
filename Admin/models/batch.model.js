const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee is required'],
      min: 0,
    },
    isKidsBatch: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    maxStudents: {
      type: Number,
      default: 30,
      min: 1,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

batchSchema.index({ branchId: 1, isActive: 1 });
batchSchema.index({ courseId: 1 });

// Check if model already exists to avoid overwrite error
const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

module.exports = Batch;
