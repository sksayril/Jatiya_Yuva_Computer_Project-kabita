const AuditLog = require('../models/auditLog.model');

const logAudit = async ({ userId, role, action, module, ip }) => {
  try {
    await AuditLog.create({
      userId,
      role,
      action,
      module,
      ip,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = {
  logAudit,
};

