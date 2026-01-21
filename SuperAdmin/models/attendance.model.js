const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: [true, 'Status is required'],
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

