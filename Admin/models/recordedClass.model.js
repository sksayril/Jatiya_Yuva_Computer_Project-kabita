const mongoose = require('mongoose');

const recordedClassSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    accessControl: {
      allowedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      }],
      allowDownload: {
        type: Boolean,
        default: false,
      },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

recordedClassSchema.index({ branchId: 1, batchId: 1 });
recordedClassSchema.index({ courseId: 1 });

// Check if model already exists to avoid overwrite error
const RecordedClass = mongoose.models.RecordedClass || mongoose.model('RecordedClass', recordedClassSchema);

module.exports = RecordedClass;
