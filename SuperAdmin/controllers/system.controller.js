const MasterSetting = require('../models/masterSetting.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const upsertSystemSetting = async (req, res, type) => {
  try {
    const data = req.body || {};
    const setting = await MasterSetting.findOneAndUpdate(
      { type },
      { type, data },
      { new: true, upsert: true }
    );

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'UPDATE',
      module: `SYSTEM_${type.toUpperCase()}`,
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error('System setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating system settings',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const backupSystem = (req, res) => upsertSystemSetting(req, res, 'backup');
const updatePermissions = (req, res) => upsertSystemSetting(req, res, 'permissions');
const updateNotifications = (req, res) => upsertSystemSetting(req, res, 'notifications');

module.exports = {
  backupSystem,
  updatePermissions,
  updateNotifications,
};

