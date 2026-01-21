const AuditLog = require('../../Admin/models/auditLog.model');

/**
 * Log teacher activity for audit trail
 */
const logAudit = async ({ branchId, userId, role, action, module, entityId, oldData, newData, ip, userAgent }) => {
  try {
    await AuditLog.create({
      branchId,
      userId,
      role,
      action,
      module,
      entityId,
      oldData,
      newData,
      ip: ip || '',
      userAgent: userAgent || '',
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = {
  logAudit,
};
