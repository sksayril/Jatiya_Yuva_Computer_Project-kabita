const mongoose = require('mongoose');

/**
 * SuperAdmin Student Model (Simplified)
 * Note: This is a simplified model for SuperAdmin use.
 * The main Student model is in Admin/models/student.model.js
 * 
 * This model should NOT be used for student registration.
 * Use Admin/models/student.model.js instead.
 */
const studentSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Use a different collection name to avoid conflicts
// Check if model already exists to avoid overwrite error
const SuperAdminStudent = mongoose.models.SuperAdminStudent || mongoose.model('SuperAdminStudent', studentSchema);

module.exports = SuperAdminStudent;

