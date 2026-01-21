const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    fees: {
      type: Number,
      required: [true, 'Fees is required'],
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = Student;

