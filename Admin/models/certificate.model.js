const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
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
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
      unique: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ branchId: 1, issueDate: -1 });
// certificateId already indexed via unique: true
certificateSchema.index({ studentId: 1 });

// Force delete the cached model to ensure fresh schema
if (mongoose.models.Certificate) {
  delete mongoose.models.Certificate;
}
const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
