const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
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
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ branchId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

// Check if model already exists to avoid overwrite error
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
