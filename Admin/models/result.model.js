const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Max marks is required'],
      min: 0,
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['PASS', 'FAIL'],
      required: [true, 'Status is required'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

resultSchema.index({ branchId: 1, examId: 1 });
resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

// Check if model already exists to avoid overwrite error
const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

module.exports = Result;
