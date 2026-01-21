const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
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
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff is required'],
      index: true,
    },
    absentDate: {
      type: Date,
      required: [true, 'Absent date is required'],
      index: true,
    },
    callStatus: {
      type: String,
      enum: ['Connected', 'Not Reachable', 'No Answer', 'Busy'],
      required: [true, 'Call status is required'],
    },
    reason: {
      type: String,
      enum: ['Sick', 'Personal', 'Financial', 'Not Interested', 'Other'],
      required: [true, 'Reason is required'],
    },
    reasonDetails: {
      type: String,
      trim: true,
    },
    expectedReturnDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    followUpStatus: {
      type: String,
      enum: ['Pending', 'Resolved', 'Dropped'],
      default: 'Pending',
    },
    nextFollowUpDate: {
      type: Date,
    },
    resolvedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

followUpSchema.index({ branchId: 1, studentId: 1 });
followUpSchema.index({ branchId: 1, staffId: 1 });
followUpSchema.index({ branchId: 1, absentDate: -1 });
followUpSchema.index({ branchId: 1, followUpStatus: 1 });

// Check if model already exists to avoid overwrite error
const FollowUp = mongoose.models.FollowUp || mongoose.model('FollowUp', followUpSchema);

module.exports = FollowUp;
