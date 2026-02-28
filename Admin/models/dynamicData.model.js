const mongoose = require('mongoose');

const dynamicDataSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
      index: true,
    },
    dataType: {
      type: String,
      required: [true, 'Data type is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Flexible data storage - can store any JSON structure
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Data is required'],
    },
    // Metadata for organization
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, strict: false } // strict: false allows additional fields
);

// Indexes for performance
dynamicDataSchema.index({ branchId: 1, dataType: 1, createdAt: -1 });
dynamicDataSchema.index({ createdBy: 1, createdAt: -1 });
dynamicDataSchema.index({ branchId: 1, createdBy: 1, dataType: 1 });
dynamicDataSchema.index({ tags: 1 });

// Check if model already exists to avoid overwrite error
const DynamicData = mongoose.models.DynamicData || mongoose.model('DynamicData', dynamicDataSchema);

module.exports = DynamicData;
