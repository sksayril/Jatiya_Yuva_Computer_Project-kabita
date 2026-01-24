const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    assignedBatches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    }],
    salaryType: {
      type: String,
      enum: ['PER_CLASS', 'MONTHLY_FIXED', 'HOURLY'],
      required: [true, 'Salary type is required'],
    },
    salaryRate: {
      type: Number,
      required: [true, 'Salary rate is required'],
      min: 0,
    },
    currentMonthClasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentMonthSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    idCardUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    loginCredentials: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

teacherSchema.index({ branchId: 1, isActive: 1 });
// Note: teacherId and email indexes are automatically created by unique: true

// Check if model already exists to avoid overwrite error
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;

