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
    weekdays: {
      type: [String],
      required: [true, 'Weekdays are required'],
      validate: {
        validator: function(v) {
          const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return v.length > 0 && v.every(day => validDays.includes(day));
        },
        message: 'Weekdays must be an array of valid days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday'
      }
    },
    monthlyFee: {
      type: Number,
      min: 0,
      default: null, // Optional - can use course monthlyFees if not provided
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
batchSchema.index({ branchId: 1, timeSlot: 1, weekdays: 1 }); // For duplicate detection

// Check if model already exists to avoid overwrite error
const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

module.exports = Batch;
