const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { generateStudentId } = require('../../Admin/utils/idGenerator');
const { generateQRCode } = require('../../Admin/utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Manual Student Registration by Staff
 * POST /api/staff/students/manual
 * Creates student with PENDING status (requires admin approval)
 */
const manualRegistration = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;

    const {
      admissionDate,
      courseName,
      courseType,
      studentName,
      guardianName,
      motherName,
      dateOfBirth,
      mobileNumber,
      whatsappNumber,
      guardianMobile,
      email,
      gender,
      religion,
      category,
      address,
      pincode,
      lastQualification,
      formNumber,
      receiptNumber,
      batchTime,
      officeEntryDate,
    } = req.body;

    // Validation - studentName and mobileNumber are required
    if (!studentName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentName, mobileNumber',
      });
    }

    // Get branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Handle course - find by name or use courseId if provided
    let course = null;
    if (req.body.courseId) {
      course = await Course.findById(req.body.courseId);
    } else if (courseName) {
      course = await Course.findOne({
        name: { $regex: `^${courseName.trim()}$`, $options: 'i' },
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found. Please provide valid courseId or courseName',
      });
    }

    // Handle batch - find by batchTime or use batchId if provided
    let batch = null;
    if (req.body.batchId) {
      batch = await Batch.findOne({ _id: req.body.batchId, branchId });
    } else if (batchTime) {
      const timeMap = {
        AM: /morning|am|9|10|11/i,
        PM: /afternoon|pm|12|1|2|3/i,
        EVENING: /evening|4|5|6|7|8/i,
      };
      const timePattern = timeMap[batchTime] || new RegExp(batchTime, 'i');
      batch = await Batch.findOne({
        branchId,
        isActive: true,
        $or: [
          { timeSlot: { $regex: timePattern } },
          { name: { $regex: timePattern } },
        ],
      });
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found. Please provide valid batchId or batchTime',
      });
    }

    // Generate Student ID
    const studentId = await generateStudentId(branch.code, Student);

    // Generate QR Code
    const qrData = JSON.stringify({ studentId, branchId, studentName });
    const qrCode = await generateQRCode(qrData);

    // Generate login credentials
    const loginEmail = email || `${studentId.toLowerCase()}@${branch.code.toLowerCase()}.edu`;
    const loginPassword = `STU${studentId.split('-')[2]}`;

    // Calculate fees
    const totalFees = course.courseFees || 0;
    const dueAmount = totalFees;

    // Handle file uploads (if any)
    const studentPhoto = req.files?.studentPhoto?.[0]?.location || req.files?.studentPhoto?.[0]?.path;
    const studentSignature = req.files?.studentSignature?.[0]?.location || req.files?.studentSignature?.[0]?.path;
    const officeSignature = req.files?.officeSignature?.[0]?.location || req.files?.officeSignature?.[0]?.path;
    const formScanImage = req.files?.formScanImage?.[0]?.location || req.files?.formScanImage?.[0]?.path;

    // Create student with PENDING status (staff registered)
    const student = await Student.create({
      branchId,
      studentId,
      studentName: studentName.trim(),
      name: studentName.trim(), // Backward compatibility
      guardianName: guardianName?.trim(),
      motherName: motherName?.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber?.trim(),
      guardianMobile: guardianMobile?.trim(),
      email: email?.trim(),
      gender,
      religion,
      category,
      address: address?.trim(),
      pincode: pincode?.trim(),
      lastQualification: lastQualification?.trim(),
      courseId: course._id,
      courseName: course.name,
      courseType: courseType || course.courseCategory,
      batchId: batch._id,
      batchTime: batchTime || batch.timeSlot,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      officeEntryDate: officeEntryDate ? new Date(officeEntryDate) : new Date(),
      formNumber: formNumber?.trim(),
      receiptNumber: receiptNumber?.trim(),
      status: 'PENDING', // Staff registered students are PENDING
      totalFees,
      dueAmount,
      qrCode,
      studentPhoto,
      studentSignature,
      officeSignature,
      formScanImage,
      loginCredentials: {
        email: loginEmail,
        password: loginPassword,
      },
      registeredBy: 'STAFF',
      registeredById: staffId,
      createdBy: 'STAFF',
      createdById: staffId,
    });

    // Update batch student count
    await Batch.findByIdAndUpdate(batch._id, { $inc: { currentStudents: 1 } });

    // Audit log
    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'CREATE_STUDENT',
      module: 'STUDENT',
      entityId: student._id.toString(),
      newData: { studentId, studentName, status: 'PENDING' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Pending admin approval.',
      data: {
        studentId: student.studentId,
        studentName: student.studentName,
        status: student.status,
        note: 'Student registration is pending. Admin approval required to activate.',
      },
    });
  } catch (error) {
    console.error('Staff student registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering student',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Scan Form (OCR Placeholder)
 * POST /api/staff/students/scan-form
 * Uploads form image and returns auto-filled form data (OCR placeholder)
 */
const scanForm = async (req, res) => {
  try {
    const formImage = req.file;

    if (!formImage) {
      return res.status(400).json({
        success: false,
        message: 'Form image is required',
      });
    }

    // OCR Placeholder - In production, integrate with OCR service
    // For now, return a template response
    res.status(200).json({
      success: true,
      message: 'Form scanned successfully (OCR placeholder)',
      data: {
        formImageUrl: formImage.location || formImage.path,
        extractedData: {
          studentName: '',
          guardianName: '',
          mobileNumber: '',
          address: '',
          courseName: '',
          date: new Date().toISOString().split('T')[0],
        },
        note: 'OCR integration required. Currently returning placeholder data.',
      },
    });
  } catch (error) {
    console.error('Form scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scanning form',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  manualRegistration,
  scanForm,
};
