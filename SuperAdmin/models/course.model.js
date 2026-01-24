const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    courseCategory: {
      type: String,
      required: [true, 'Course category is required'],
      enum: ['Basic', 'Advanced', 'Diploma'],
    },
    courseFees: {
      type: Number,
      required: [true, 'Course fees is required'],
      min: 0,
    },
    admissionFees: {
      type: Number,
      required: [true, 'Admission fees is required'],
      min: 0,
    },
    monthlyFees: {
      type: Number,
      required: [true, 'Monthly fees is required'],
      min: 0,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF URL is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: [true, 'CreatedBy is required'],
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'APPROVED', // Default to APPROVED, will be set to PENDING in Admin controller
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SuperAdmin',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

module.exports = Course;

