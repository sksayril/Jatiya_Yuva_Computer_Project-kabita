const Certificate = require('../../Admin/models/certificate.model');
const Student = require('../../Admin/models/student.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Result = require('../../Admin/models/result.model');
const config = require('../config/env.config');

/**
 * Get Student Certificates
 * GET /api/student/certificates
 */
const getCertificates = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;

    const student = await Student.findById(studentId).select('courseId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get certificates for this student
    const certificates = await Certificate.find({
      branchId,
      studentId,
    })
      .populate('courseId', 'name courseCategory')
      .sort({ issueDate: -1 });

    // Check eligibility for new certificates
    const eligibilityChecks = [];

    if (student.courseId) {
      // Check attendance percentage
      const totalAttendances = await StudentAttendance.countDocuments({
        branchId,
        studentId,
      });
      const presentCount = await StudentAttendance.countDocuments({
        branchId,
        studentId,
        status: 'Present',
      });
      const attendancePercentage =
        totalAttendances === 0 ? 0 : Math.round((presentCount / totalAttendances) * 100);

      // Check exam results
      const examResults = await Result.find({
        branchId,
        studentId,
      });
      const allExamsPassed = examResults.length > 0 && examResults.every((r) => r.status === 'PASS');

      eligibilityChecks.push({
        courseId: student.courseId,
        attendancePercentage,
        requiredAttendance: 75, // Typically 75% required
        attendanceEligible: attendancePercentage >= 75,
        allExamsPassed,
        eligible: attendancePercentage >= 75 && allExamsPassed,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificates,
        eligibilityChecks,
        note: 'Certificates are issued only after meeting attendance and exam requirements.',
      },
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

/**
 * Download Certificate PDF
 * GET /api/student/certificates/:id/download
 */
const downloadCertificate = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { id } = req.params;

    const certificate = await Certificate.findOne({
      _id: id,
      branchId,
      studentId, // Ensure student can only download their own certificates
    })
      .populate('courseId', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        courseName: certificate.courseId?.name,
        issueDate: certificate.issueDate,
        certificatePdfUrl: certificate.certificatePdfUrl,
        qrCode: certificate.qrCode,
        verificationLink: `/api/certificates/verify/${certificate.certificateId}`,
        note: 'Certificate PDF can be downloaded using the provided URL',
      },
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading certificate',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getCertificates,
  downloadCertificate,
};
