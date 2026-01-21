const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = Lead;

