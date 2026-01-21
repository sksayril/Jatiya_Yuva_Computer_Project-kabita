const Certificate = require('../models/certificate.model');
const MasterSetting = require('../models/masterSetting.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const upsertCertificateSetting = async (req, res, type) => {
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
      module: `CERTIFICATE_${type.toUpperCase()}`,
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error('Certificate setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating certificate settings',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const createCertificateTemplate = (req, res) =>
  upsertCertificateSetting(req, res, 'certificate-template');

const createCertificateRules = (req, res) =>
  upsertCertificateSetting(req, res, 'certificate-rules');

const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId: certificateId.trim() });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        verified: certificate.verified,
        issueDate: certificate.issueDate,
        studentId: certificate.studentId,
      },
    });
  } catch (error) {
    console.error('Certificate verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying certificate',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createCertificateTemplate,
  createCertificateRules,
  verifyCertificate,
};

