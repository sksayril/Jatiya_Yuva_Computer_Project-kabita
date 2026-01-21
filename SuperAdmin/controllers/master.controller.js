const MasterSetting = require('../models/masterSetting.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const upsertMasterSetting = async (req, res, type) => {
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
      module: `MASTER_${type.toUpperCase()}`,
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error('Master setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating master settings',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const createCourse = (req, res) => upsertMasterSetting(req, res, 'courses');
const createFeeRules = (req, res) => upsertMasterSetting(req, res, 'fee-rules');
const createDiscountPolicy = (req, res) => upsertMasterSetting(req, res, 'discount-policy');
const createExamRules = (req, res) => upsertMasterSetting(req, res, 'exam-rules');
const createCertificateTemplate = (req, res) =>
  upsertMasterSetting(req, res, 'certificate-template');

module.exports = {
  createCourse,
  createFeeRules,
  createDiscountPolicy,
  createExamRules,
  createCertificateTemplate,
};

