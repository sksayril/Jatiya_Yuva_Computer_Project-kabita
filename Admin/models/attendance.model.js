const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    timeSlot: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: [true, 'Status is required'],
    },
    method: {
      type: String,
      enum: ['QR', 'FACE', 'MANUAL'],
      default: 'MANUAL',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Staff attendance schema
const staffAttendanceSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    timeSlot: {
      type: String,
      trim: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: [true, 'Status is required'],
    },
    method: {
      type: String,
      enum: ['QR', 'MANUAL'],
      default: 'MANUAL',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes
attendanceSchema.index({ branchId: 1, date: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ batchId: 1, date: 1 });
attendanceSchema.index({ branchId: 1, studentId: 1, date: 1 }, { unique: true });

staffAttendanceSchema.index({ branchId: 1, date: 1 });
staffAttendanceSchema.index({ staffId: 1, date: 1 });
staffAttendanceSchema.index({ branchId: 1, staffId: 1, date: 1 }, { unique: true });

// Check if models already exist to avoid overwrite error
const StudentAttendance = mongoose.models.StudentAttendance || mongoose.model('StudentAttendance', attendanceSchema);
const StaffAttendance = mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', staffAttendanceSchema);

module.exports = {
  StudentAttendance,
  StaffAttendance,
};
