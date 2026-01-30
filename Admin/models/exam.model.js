const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    examType: {
      type: String,
      enum: ['MONTHLY', '6M', '1Y'],
      required: [true, 'Exam type is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Max marks is required'],
      min: 0,
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ branchId: 1, examDate: -1 });
examSchema.index({ courseId: 1 });

// Check if model already exists to avoid overwrite error
const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

module.exports = Exam;
