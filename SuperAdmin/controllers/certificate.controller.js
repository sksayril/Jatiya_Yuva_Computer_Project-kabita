const Certificate = require('../models/certificate.model');
const MasterSetting = require('../models/masterSetting.model');
const Course = require('../models/course.model');
const Student = require('../models/student.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');
const mongoose = require('mongoose');

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

/**
 * Get All Certificates (Super Admin)
 * GET /api/super-admin/certificates
 */
const getCertificates = async (req, res) => {
  try {
    const { studentId, courseId, branchId } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;

    const certificates = await Certificate.find(query)
      .populate({
        path: 'studentId',
        select: 'studentId studentName name'
      })
      .populate({
        path: 'courseId',
        select: 'name courseCategory'
      })
      .populate({
        path: 'branchId',
        select: 'name code'
      })
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error('Get certificates error (SuperAdmin):', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching certificates',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createCertificateTemplate,
  createCertificateRules,
  verifyCertificate,
  getCertificates,
};

