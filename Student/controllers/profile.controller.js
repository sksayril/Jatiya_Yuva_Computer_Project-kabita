const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const { generateQRCode } = require('../../Admin/utils/qrGenerator');
const config = require('../config/env.config');

/**
 * Get Student Profile
 * GET /api/student/profile
 */
const getProfile = async (req, res) => {
  try {
    const studentId = req.studentId;

    const student = await Student.findById(studentId)
      .populate('batchId', 'name timeSlot teacherId')
      .populate('courseId', 'name duration courseCategory');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get teacher name if batch has teacher
    let teacherName = null;
    if (student.batchId?.teacherId) {
      const Staff = require('../../Admin/models/staff.model');
      const teacher = await Staff.findById(student.batchId.teacherId).select('name');
      if (teacher) {
        teacherName = teacher.name;
      }
    }

    // Generate or retrieve QR code for ID card
    let qrCode = student.qrCode;
    if (!qrCode) {
      const qrData = JSON.stringify({
        studentId: student.studentId,
        branchId: student.branchId.toString(),
        studentName: student.studentName || student.name,
      });
      qrCode = await generateQRCode(qrData);
      // Optionally save to student record
      // await Student.findByIdAndUpdate(studentId, { qrCode });
    }

    res.status(200).json({
      success: true,
      data: {
        // Personal Information
        studentId: student.studentId,
        studentName: student.studentName || student.name,
        guardianName: student.guardianName,
        motherName: student.motherName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        religion: student.religion,
        category: student.category,
        
        // Contact Information
        mobileNumber: student.mobileNumber || student.mobile,
        whatsappNumber: student.whatsappNumber,
        guardianMobile: student.guardianMobile,
        email: student.email,
        
        // Address
        address: student.address,
        pincode: student.pincode,
        
        // Education
        lastQualification: student.lastQualification,
        
        // Course & Batch
        course: {
          id: student.courseId?._id,
          name: student.courseName || student.courseId?.name,
          type: student.courseType || student.courseId?.courseCategory,
          duration: student.courseId?.duration,
        },
        batch: {
          id: student.batchId?._id,
          name: student.batchId?.name,
          timeSlot: student.batchTime || student.batchId?.timeSlot,
          teacherName: teacherName,
        },
        
        // Dates
        admissionDate: student.admissionDate,
        officeEntryDate: student.officeEntryDate,
        
        // ID Card
        idCard: {
          qrCode: qrCode,
          studentPhoto: student.studentPhoto,
          idCardUrl: student.idCardUrl,
        },
        
        // Status
        status: student.status,
      },
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Download/Print ID Card
 * GET /api/student/profile/id-card
 */
const getIdCard = async (req, res) => {
  try {
    const studentId = req.studentId;

    const student = await Student.findById(studentId).select('studentId studentName qrCode studentPhoto idCardUrl');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Generate QR code if not exists
    let qrCode = student.qrCode;
    if (!qrCode) {
      const { generateQRCode } = require('../../Admin/utils/qrGenerator');
      const qrData = JSON.stringify({
        studentId: student.studentId,
        branchId: student.branchId.toString(),
        studentName: student.studentName || student.name,
      });
      qrCode = await generateQRCode(qrData);
    }

    res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        studentName: student.studentName || student.name,
        qrCode: qrCode,
        studentPhoto: student.studentPhoto,
        idCardUrl: student.idCardUrl,
        note: 'ID card can be downloaded or printed using the provided data',
      },
    });
  } catch (error) {
    console.error('Get ID card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ID card',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getProfile,
  getIdCard,
};
