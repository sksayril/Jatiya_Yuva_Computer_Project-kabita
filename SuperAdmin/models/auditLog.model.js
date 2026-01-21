const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;

