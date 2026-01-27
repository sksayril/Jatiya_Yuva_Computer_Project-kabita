const Student = require('../models/student.model');
const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { generateStudentId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Manual Student Registration
 * POST /api/admin/students/manual
 */
const manualRegistration = async (req, res) => {
  try {
    // Get branchId - use AUTO or from middleware
    let branchId = req.branchId;
    
    // If branchId is not set from middleware, try to get from body
    if (!branchId && req.body.branchId && req.body.branchId !== 'AUTO') {
      branchId = req.body.branchId;
    }
    
    // Validate branchId format (must be valid MongoDB ObjectId)
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branchId format',
      });
    }

    // Extract data from new nested structure
    const {
      admission,
      student: studentDataFromBody,
      family_details,
      contact_details,
      address: addressData,
      education,
      office_use,
      studentId: providedStudentId,
      status: providedStatus,
    } = req.body;

    // Map nested structure to flat structure for backward compatibility
    const admissionDate = admission?.admission_date;
    let courseName = admission?.course?.code; // Use let instead of const to allow reassignment
    const courseType = admission?.course?.type;
    
    const studentName = studentDataFromBody?.name;
    const dateOfBirth = studentDataFromBody?.date_of_birth;
    const gender = studentDataFromBody?.gender;
    const religion = studentDataFromBody?.religion;
    const category = studentDataFromBody?.caste; // Map caste to category
    
    const guardianName = family_details?.guardian_name;
    const motherName = family_details?.mother_name;
    
    const mobileNumber = contact_details?.mobile;
    const whatsappNumber = contact_details?.whatsapp;
    const guardianMobile = contact_details?.guardian_contact;
    const email = contact_details?.email;
    
    // Build address string from nested address object
    const addressParts = [];
    if (addressData?.village) addressParts.push(addressData.village);
    if (addressData?.post_office) addressParts.push(addressData.post_office);
    if (addressData?.district) addressParts.push(addressData.district);
    if (addressData?.state) addressParts.push(addressData.state);
    if (addressData?.country) addressParts.push(addressData.country);
    const address = addressParts.join(', ');
    const pincode = addressData?.pincode;
    
    const lastQualification = education?.last_qualification;
    
    const formNumber = office_use?.form_number;
    const receiptNumber = office_use?.receipt_number;
    const batchTime = office_use?.batch_time;
    const officeEntryDate = office_use?.date;

    // Validation - student.name and contact_details.mobile are required
    if (!studentName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student.name, contact_details.mobile',
      });
    }

    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required. Please ensure you are authenticated with a valid JWT token that includes branchId.',
        debug: config.isDevelopment() ? {
          hasReqBranchId: !!req.branchId,
          hasBodyBranchId: !!req.body.branchId,
          userBranchId: req.user?.branchId,
          userExists: !!req.user,
        } : undefined,
      });
    }

    // Get branch
    let branch;
    try {
      branch = await Branch.findById(branchId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branchId format',
        error: config.isDevelopment() ? error.message : undefined,
      });
    }
    
    if (!branch) {
      // Check if branch exists but is deleted
      const deletedBranch = await Branch.findOne({ _id: branchId, isDeleted: true });
      if (deletedBranch) {
        return res.status(400).json({
          success: false,
          message: 'Branch exists but is marked as deleted. Please restore the branch first using SuperAdmin API.',
          debug: config.isDevelopment() ? {
            branchId,
            branchName: deletedBranch.name,
            branchCode: deletedBranch.code,
            isDeleted: deletedBranch.isDeleted,
            status: deletedBranch.status,
            suggestion: 'Use POST /api/super-admin/branches/:id/update to restore the branch',
          } : undefined,
        });
      }
      
      // Branch doesn't exist at all
      return res.status(404).json({ 
        success: false, 
        message: `Branch not found with ID: ${branchId}. The branch does not exist in the database.`,
        debug: config.isDevelopment() ? {
          branchId,
          branchIdType: typeof branchId,
          isValidObjectId: mongoose.Types.ObjectId.isValid(branchId),
          stepsToFix: [
            '1. Login as SuperAdmin',
            '2. Create a branch: POST /api/super-admin/branches',
            '3. Create/Update admin with the new branchId: POST /api/super-admin/branch-admins',
            '4. Login again as admin to get new token with correct branchId',
          ],
        } : undefined,
      });
    }

    // Check if branch is deleted
    if (branch.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create student for a deleted branch',
      });
    }
    
    // Check if branch is locked
    if (branch.status === 'LOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create student for a locked branch. Please unlock the branch first.',
      });
    }

    // Handle course - find by name or use courseId if provided
    let course = null;
    let courseId = null;
    if (req.body.courseId) {
      course = await Course.findById(req.body.courseId);
      if (course) courseId = course._id;
    } else if (courseName) {
      // Try to find course by name (case-insensitive)
      course = await Course.findOne({
        name: { $regex: `^${courseName.trim()}$`, $options: 'i' },
      });
      if (course) {
        courseId = course._id;
        // Update courseName to match the actual course name from database
        courseName = course.name;
      } else {
        // Course not found - will be stored as courseName only
        console.warn(`Course "${courseName}" not found, storing as courseName only`);
      }
    }
    
    // Ensure courseName is set (use the provided value or empty string)
    const finalCourseName = courseName?.trim() || '';

    // Handle batch - find by batchTime or use batchId if provided
    let batch = null;
    let batchId = null;
    if (req.body.batchId) {
      batch = await Batch.findOne({ _id: req.body.batchId, branchId });
      if (batch) batchId = batch._id;
    } else if (batchTime) {
      // Try to find batch by time slot
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
      if (batch) {
        batchId = batch._id;
      }
    }

    // Generate Student ID if AUTO or not provided
    let studentId = providedStudentId;
    if (!studentId || studentId === 'AUTO') {
      studentId = await generateStudentId(branch.code, Student);
    }

    // Handle file uploads
    const studentPhoto = req.files?.studentPhoto?.[0]
      ? req.files.studentPhoto[0].location || req.files.studentPhoto[0].path
      : '';
    const studentSignature = req.files?.studentSignature?.[0]
      ? req.files.studentSignature[0].location || req.files.studentSignature[0].path
      : '';
    const officeSignature = req.files?.officeSignature?.[0]
      ? req.files.officeSignature[0].location || req.files.officeSignature[0].path
      : '';
    const formScanImage = req.files?.formScanImage?.[0]
      ? req.files.formScanImage[0].location || req.files.formScanImage[0].path
      : '';

    // Generate login credentials
    const loginEmail = email || `${studentId.toLowerCase()}@${branch.code.toLowerCase()}.edu`;
    const password = `STU${studentId.split('-')[2] || Math.random().toString(36).substring(7)}`;

    // Calculate initial fees (from course if available)
    const totalFees = course ? course.courseFees || 0 : 0;
    const dueAmount = totalFees;

    // Determine status
    const status = providedStatus || 'ACTIVE';

    // Prepare student data
    const studentData = {
      branchId,
      studentId,
      studentName: studentName.trim(),
      name: studentName.trim(), // Keep for backward compatibility
      guardianName: guardianName?.trim(),
      motherName: motherName?.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender?.trim(),
      religion: religion?.trim(),
      category: category?.trim(),
      mobileNumber: mobileNumber.trim(),
      mobile: mobileNumber.trim(), // Keep for backward compatibility
      whatsappNumber: whatsappNumber?.trim() || mobileNumber.trim(),
      guardianMobile: guardianMobile?.trim() || mobileNumber.trim(),
      email: email?.trim().toLowerCase(),
      address: address?.trim(),
      pincode: pincode?.trim(),
      lastQualification: lastQualification?.trim(),
      courseId,
      courseName: finalCourseName,
      courseType: courseType?.trim(),
      batchId,
      batchTime: batchTime?.trim(),
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      registrationDate: admissionDate ? new Date(admissionDate) : new Date(), // Keep for backward compatibility
      officeEntryDate: officeEntryDate ? new Date(officeEntryDate) : new Date(),
      formNumber: formNumber?.trim(),
      receiptNumber: receiptNumber?.trim(),
      studentPhoto,
      studentSignature,
      officeSignature,
      formScanImage,
      status,
      totalFees,
      dueAmount,
      loginCredentials: {
        email: loginEmail,
        password,
      },
      createdBy: 'ADMIN',
      createdById: req.user.id,
    };

    // Verify we're using the correct Student model (Admin model, not SuperAdmin model)
    // The Admin Student model should NOT have 'course' or 'fees' as required fields
    if (config.isDevelopment()) {
      console.log('📝 Creating student with model:', Student.modelName);
      console.log('📝 Student data keys:', Object.keys(studentData));
      console.log('📝 Course info:', { courseId, courseName: finalCourseName, courseType, totalFees });
    }

    // Create student
    const student = await Student.create(studentData);

    // Update batch student count if batch exists
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $inc: { currentStudents: 1 },
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STUDENT',
      entityId: student._id,
      newData: { studentId, studentName, mobileNumber },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        studentId: student.studentId,
        studentName: student.studentName,
        loginCredentials: student.loginCredentials,
      },
    });
  } catch (error) {
    console.error('Manual registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student registration',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Scan Form Image (OCR Placeholder)
 * POST /api/admin/students/scan-form
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

    // OCR Placeholder - Return mock extracted data
    // TODO: Integrate actual OCR service (Tesseract, Google Vision API, etc.)
    const extractedData = {
      name: 'Extracted Name',
      mobile: '1234567890',
      address: 'Extracted Address',
      course: 'DCA',
      date: new Date().toISOString(),
      // Add more fields as needed
    };

    res.status(200).json({
      success: true,
      message: 'Form scanned successfully (OCR placeholder)',
      data: extractedData,
      note: 'This is a placeholder. Integrate actual OCR service for production.',
    });
  } catch (error) {
    console.error('Scan form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during form scanning',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Approve Pending Student
 * PATCH /api/admin/students/:id/approve
 */
const approveStudent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, branchId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Student is not in pending status',
      });
    }

    const oldData = { status: student.status };
    student.status = 'ACTIVE';
    await student.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'APPROVE',
      module: 'STUDENT',
      entityId: student._id,
      oldData,
      newData: { status: 'ACTIVE' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student approved successfully',
      data: student,
    });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student approval',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Drop Student
 * PATCH /api/admin/students/:id/drop
 */
const dropStudent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, branchId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const oldData = { status: student.status };
    student.status = 'DROPPED';
    await student.save();

    // Update batch student count
    await Batch.findByIdAndUpdate(student.batchId, {
      $inc: { currentStudents: -1 },
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DROP',
      module: 'STUDENT',
      entityId: student._id,
      oldData,
      newData: { status: 'DROPPED' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student dropped successfully',
      data: student,
    });
  } catch (error) {
    console.error('Drop student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student drop',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Reactivate Dropped Student
 * POST /api/admin/students/:id/reactivate
 */
const reactivateStudent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { batchId } = req.body;

    // Validate branch
    const branch = await Branch.findOne({ _id: branchId, isDeleted: false });
    if (!branch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive branch',
      });
    }

    // Find student
    const student = await Student.findOne({ _id: id, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if student is in DROPPED status
    if (student.status !== 'DROPPED') {
      return res.status(400).json({
        success: false,
        message: 'Student is not in DROPPED status',
      });
    }

    // Determine which batch to use
    let assignedBatchId = batchId;
    
    if (!assignedBatchId && student.batchId) {
      // Try to reuse previous batch if it's still active
      const previousBatch = await Batch.findById(student.batchId);
      if (previousBatch && previousBatch.isActive) {
        assignedBatchId = student.batchId;
      } else {
        return res.status(400).json({
          success: false,
          message: "Student's previous batch is inactive. Provide a new batchId.",
        });
      }
    }

    if (!assignedBatchId) {
      return res.status(400).json({
        success: false,
        message: 'batchId is required to reactivate student',
      });
    }

    // Validate new batch
    const batch = await Batch.findOne({ _id: assignedBatchId, branchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or inactive',
      });
    }

    if (!batch.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected batch is inactive',
      });
    }

    // Update student status to ACTIVE
    student.status = 'ACTIVE';
    student.batchId = assignedBatchId;
    
    // Reset fees tracking if needed
    if (!student.totalFees) {
      student.totalFees = batch.monthlyFee || 0;
    }

    await student.save();

    // Increment batch student count
    await Batch.findByIdAndUpdate(assignedBatchId, { $inc: { currentStudents: 1 } });

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'REACTIVATE_STUDENT',
      module: 'STUDENT',
      entityId: student._id,
      oldData: { status: 'DROPPED' },
      newData: { status: 'ACTIVE', batchId: assignedBatchId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student reactivated successfully',
      data: {
        _id: student._id,
        studentId: student.studentId,
        studentName: student.studentName || student.name,
        status: student.status,
        batchId: student.batchId,
        totalFees: student.totalFees,
        paidAmount: student.paidAmount || 0,
        dueAmount: (student.totalFees || 0) - (student.paidAmount || 0),
        loginCredentials: {
          email: student.email,
          password: student.password,
        },
      },
    });
  } catch (error) {
    console.error('Reactivate student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student reactivation',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Change Student Batch
 * PATCH /api/admin/students/:id/change-batch
 */
const changeBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { newBatchId } = req.body;

    if (!newBatchId) {
      return res.status(400).json({
        success: false,
        message: 'newBatchId is required',
      });
    }

    const student = await Student.findOne({ _id: id, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const newBatch = await Batch.findOne({ _id: newBatchId, branchId });
    if (!newBatch) {
      return res.status(404).json({ success: false, message: 'New batch not found' });
    }

    const oldBatchId = student.batchId.toString();
    const oldData = { batchId: oldBatchId };

    // Update student batch
    student.batchId = newBatchId;
    await student.save();

    // Update batch counts
    await Promise.all([
      Batch.findByIdAndUpdate(oldBatchId, { $inc: { currentStudents: -1 } }),
      Batch.findByIdAndUpdate(newBatchId, { $inc: { currentStudents: 1 } }),
    ]);

    // Recalculate fees if needed (different batch might have different fees)
    // TODO: Implement fee recalculation logic

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CHANGE_BATCH',
      module: 'STUDENT',
      entityId: student._id,
      oldData,
      newData: { batchId: newBatchId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student batch changed successfully',
      data: student,
    });
  } catch (error) {
    console.error('Change batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during batch change',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get All Students
 * GET /api/admin/students
 */
const getStudents = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { status, batchId, courseId } = req.query;

    const query = { branchId };
    if (status) query.status = status;
    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;

    const students = await Student.find(query)
      .populate('courseId', 'name courseCategory')
      .populate('batchId', 'name timeSlot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Student by ID
 * GET /api/admin/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, branchId })
      .populate('courseId')
      .populate('batchId')
      .populate('createdById', 'name email');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  manualRegistration,
  scanForm,
  approveStudent,
  dropStudent,
  reactivateStudent,
  changeBatch,
  getStudents,
  getStudentById,
};
