const Certificate = require('../models/certificate.model');
const Student = require('../models/student.model');
const Result = require('../models/result.model');
const Exam = require('../models/exam.model');
const { generateCertificateId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Generate Certificate
 * POST /api/admin/certificates
 * Requires student to have PASS result
 */
const generateCertificate = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, courseId',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if student has passed required exam
    const exams = await Exam.find({ branchId, courseId });
    if (exams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No exams found for this course',
      });
    }

    // Check if student has passed all required exams
    const results = await Result.find({
      branchId,
      studentId: student._id,
      examId: { $in: exams.map(e => e._id) },
    });

    const allPassed = results.every(r => r.status === 'PASS');
    if (!allPassed) {
      return res.status(400).json({
        success: false,
        message: 'Student must pass all required exams to receive certificate',
      });
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ branchId, studentId: student._id, courseId });
    if (existingCert) {
      return res.status(409).json({
        success: false,
        message: 'Certificate already generated for this student and course',
        data: existingCert,
      });
    }

    // Generate certificate ID
    const certificateId = await generateCertificateId(Certificate);

    // Create certificate
    const certificate = await Certificate.create({
      branchId,
      studentId: student._id,
      courseId,
      certificateId,
      issueDate: new Date(),
      verified: true,
      generatedBy: req.user.id,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'CERTIFICATE',
      entityId: certificate._id,
      newData: { certificateId, studentId: student.studentId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating certificate',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Certificates
 * GET /api/admin/certificates
 */
const getCertificates = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, courseId } = req.query;

    const query = { branchId };
    if (studentId) {
      const student = await Student.findOne({ studentId, branchId });
      if (student) query.studentId = student._id;
      else query.studentId = null; // Ensure no results if student not found
    }
    if (courseId) query.courseId = courseId;

    const certificates = await Certificate.find(query)
      .populate('studentId', 'studentId name')
      .populate('courseId', 'name courseCategory')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching certificates',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  generateCertificate,
  getCertificates,
};
