const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    staffId: {
      type: String,
      required: [true, 'Staff ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
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
    role: {
      type: String,
      enum: ['STAFF', 'TEACHER'],
      required: [true, 'Role is required'],
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
    qrCode: {
      type: String,
      trim: true,
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

staffSchema.index({ branchId: 1, role: 1 });
// staffId and email already indexed via unique: true

// Check if model already exists to avoid overwrite error
const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);

module.exports = Staff;
