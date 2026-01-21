const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
    },
    noticeType: {
      type: String,
      enum: ['CLASS', 'EXAM', 'HOLIDAY', 'GENERAL', 'PAYMENT'],
      required: [true, 'Notice type is required'],
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'BATCH', 'COURSE', 'STUDENT'],
      default: 'ALL',
    },
    targetBatchIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    }],
    targetCourseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
    targetStudentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
      default: 'ADMIN',
    },
  },
  { timestamps: true }
);

noticeSchema.index({ branchId: 1, noticeType: 1 });
noticeSchema.index({ branchId: 1, isActive: 1 });
noticeSchema.index({ branchId: 1, startDate: -1 });

// Check if model already exists to avoid overwrite error
const Notice = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);

module.exports = Notice;
