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
    // Parse JSON strings if they come from form-data
    let admission = req.body.admission;
    let studentDataFromBody = req.body.student;
    let family_details = req.body.family_details;
    let contact_details = req.body.contact_details;
    let addressData = req.body.address;
    let education = req.body.education;
    let office_use = req.body.office_use;
    const studentId = req.body.studentId;
    const providedStatus = req.body.status;

    // Parse JSON strings if they are strings (from form-data)
    try {
      if (typeof admission === 'string') admission = JSON.parse(admission);
      if (typeof studentDataFromBody === 'string') studentDataFromBody = JSON.parse(studentDataFromBody);
      if (typeof family_details === 'string') family_details = JSON.parse(family_details);
      if (typeof contact_details === 'string') contact_details = JSON.parse(contact_details);
      if (typeof addressData === 'string') addressData = JSON.parse(addressData);
      if (typeof education === 'string') education = JSON.parse(education);
      if (typeof office_use === 'string') office_use = JSON.parse(office_use);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in nested objects. Please ensure all nested objects are valid JSON strings.',
        error: config.isDevelopment() ? parseError.message : undefined,
      });
    }

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
    const providedStudentId = studentId;
    let finalStudentId = providedStudentId;
    if (!finalStudentId || finalStudentId === 'AUTO') {
      finalStudentId = await generateStudentId(branch.code, Student);
      // Verify studentId doesn't already exist (double-check)
      const existingStudentId = await Student.findOne({ studentId: finalStudentId });
      if (existingStudentId) {
        // If exists, generate a new one
        finalStudentId = await generateStudentId(branch.code, Student);
      }
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
    const aadharCardImage = req.files?.aadharCardImage?.[0]
      ? req.files.aadharCardImage[0].location || req.files.aadharCardImage[0].path
      : '';
    const schoolCertificateImage = req.files?.schoolCertificateImage?.[0]
      ? req.files.schoolCertificateImage[0].location || req.files.schoolCertificateImage[0].path
      : '';

    // Generate unique password based on student ID
    // This ensures each student gets a different password based on their unique student ID
    const generateStudentPassword = async (studentId) => {
      // Parse student ID parts (e.g., YUVA-0002-2026-001 or DHK001-2024-001)
      const parts = studentId.split('-');

      let passwordBase = '';
      if (parts.length >= 3) {
        // Format: BRANCH-YEAR-SEQUENCE or BRANCH-SEQUENCE-YEAR-SEQUENCE
        const branchPart = parts[0].substring(0, 3).toUpperCase(); // First 3 chars of branch code
        let yearPart = '';
        let sequencePart = '';

        if (parts.length === 4) {
          // Format: YUVA-0002-2026-001
          yearPart = parts[2].substring(2); // Last 2 digits of year (26 from 2026)
          sequencePart = parts[3]; // Sequence number (001)
        } else {
          // Format: DHK001-2024-001
          yearPart = parts[1].substring(2); // Last 2 digits of year (24 from 2024)
          sequencePart = parts[2]; // Sequence number (001)
        }

        // Create password base: BRANCH + YEAR + SEQUENCE (e.g., YUV26001 or DHK24001)
        passwordBase = `${branchPart}${yearPart}${sequencePart}`;
      } else {
        // Fallback: use student ID without hyphens
        passwordBase = studentId.replace(/-/g, '').substring(0, 8).toUpperCase();
      }

      // Add uniqueness using hash of full student ID
      let hash = 0;
      for (let i = 0; i < studentId.length; i++) {
        const char = studentId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashPart = Math.abs(hash).toString().substring(0, 4);

      // Combine: BASE + HASH (e.g., YUV260011234 or DHK240011234)
      let uniquePassword = `${passwordBase}${hashPart}`;

      // Ensure password is at least 8 characters
      if (uniquePassword.length < 8) {
        uniquePassword = uniquePassword + Math.random().toString(36).substring(2, 10 - uniquePassword.length).toUpperCase();
      }

      // Limit to 16 characters max
      uniquePassword = uniquePassword.substring(0, 16);

      // Check if this password already exists for another student
      const existingStudent = await Student.findOne({
        'loginCredentials.password': uniquePassword,
      });

      // If password exists, add more uniqueness
      if (existingStudent) {
        const additionalUniqueness = Math.random().toString(36).substring(2, 6).toUpperCase();
        uniquePassword = `${passwordBase}${hashPart}${additionalUniqueness}`.substring(0, 16);

        // Double-check uniqueness
        const stillExists = await Student.findOne({
          'loginCredentials.password': uniquePassword,
        });

        if (stillExists) {
          // Last resort: use timestamp-based uniqueness
          const timestamp = Date.now().toString(36).substring(5, 9).toUpperCase();
          uniquePassword = `${passwordBase}${timestamp}`.substring(0, 16);
        }
      }

      return uniquePassword;
    };

    // Generate login credentials with unique password based on student ID
    const loginEmail = email || `${finalStudentId.toLowerCase()}@${branch.code.toLowerCase()}.edu`;
    const password = await generateStudentPassword(finalStudentId);

    // Calculate initial fees (from course if available)
    const totalFees = course ? course.courseFees || 0 : 0;
    const dueAmount = totalFees;

    // Determine status
    const status = providedStatus || 'ACTIVE';

    // Prepare student data
    const studentData = {
      branchId,
      studentId: finalStudentId,
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
      aadharCardImage,
      schoolCertificateImage,
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

    // Create student with retry logic for duplicate key errors
    let student;
    let retries = 0;
    const maxRetries = 3;
    let currentStudentId = finalStudentId;

    while (retries < maxRetries) {
      try {
        // Update studentId in studentData for retry attempts
        studentData.studentId = currentStudentId;

        student = await Student.create(studentData);
        break; // Success, exit retry loop
      } catch (createError) {
        // Check if it's a duplicate key error for studentId
        if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.studentId) {
          retries++;
          if (retries >= maxRetries) {
            // Max retries reached, return error
            return res.status(409).json({
              success: false,
              message: `Student ID "${currentStudentId}" already exists. Please try again.`,
              error: config.isDevelopment() ? createError.message : undefined,
            });
          }
          // Generate a new studentId and retry (only if AUTO mode)
          if (!providedStudentId || providedStudentId === 'AUTO') {
            currentStudentId = await generateStudentId(branch.code, Student);
            // Also update password generation with new studentId
            studentData.loginCredentials.password = await generateStudentPassword(currentStudentId);
            studentData.loginCredentials.email = email || `${currentStudentId.toLowerCase()}@${branch.code.toLowerCase()}.edu`;
          } else {
            // Custom ID provided but duplicate - return error immediately
            return res.status(409).json({
              success: false,
              message: `Student ID "${currentStudentId}" already exists. Please use a different ID.`,
              error: config.isDevelopment() ? createError.message : undefined,
            });
          }
          continue;
        }
        // If it's a different error (e.g., duplicate email), throw it
        throw createError;
      }
    }

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
      newData: { studentId: student.studentId, studentName, mobileNumber },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        studentId: student.studentId,
        studentName: student.studentName,
        password: student.loginCredentials?.password || password,
        loginCredentials: student.loginCredentials,
      },
    });
  } catch (error) {
    console.error('Manual registration error:', error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.studentId) {
        return res.status(409).json({
          success: false,
          message: `Student ID "${error.keyValue?.studentId || 'unknown'}" already exists. Please try again or use a different ID.`,
          error: config.isDevelopment() ? error.message : undefined,
        });
      }
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
          error: config.isDevelopment() ? error.message : undefined,
        });
      }
    }

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

    // Map students to include password in response for Admin visibility
    const studentsData = students.map(student => {
      const studentObj = student.toObject();
      studentObj.password = student.loginCredentials?.password || null;
      return studentObj;
    });

    res.status(200).json({
      success: true,
      data: studentsData,
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

    // Include password in response for Admin visibility
    const studentData = student.toObject();
    studentData.password = student.loginCredentials?.password || null;

    // Keep loginCredentials for backward compatibility, but also add password at root level
    // loginCredentials is already included in studentData

    res.status(200).json({
      success: true,
      data: studentData,
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

/**
 * Join Student to Batch
 * POST /api/admin/students/:studentId/join-batch
 */
const joinBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id: studentId } = req.params;
    const { batchId } = req.body;

    // Validate required fields
    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: batchId',
      });
    }

    // Validate batchId format
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batchId format',
      });
    }

    // Check student exists and belongs to branch
    const student = await Student.findOne({ _id: studentId, branchId })
      .populate('courseId', 'name monthlyFees');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check student is not already assigned to a batch
    if (student.batchId) {
      return res.status(400).json({
        success: false,
        message: 'Student is already assigned to a batch',
      });
    }

    // Check batch exists, is active, and belongs to branch
    const batch = await Batch.findOne({ _id: batchId, branchId, isActive: true })
      .populate('courseId', 'name monthlyFees');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or is inactive',
      });
    }

    // Check batch is not full
    if (batch.currentStudents >= batch.maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Batch is full. Max capacity: ${batch.maxStudents}`,
      });
    }

    // Get monthly fee from batch or course
    const monthlyFee = batch.monthlyFee || (batch.courseId?.monthlyFees || 0);

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      {
        batchId,
        status: 'ACTIVE',
        joinDate: new Date(),
        totalFees: monthlyFee,
        paidAmount: 0,
        dueAmount: monthlyFee,
      },
      { new: true }
    ).populate('batchId', 'name timeSlot monthlyFee maxStudents');

    // Increase batch current students count
    await Batch.findByIdAndUpdate(batchId, {
      $inc: { currentStudents: 1 },
    });

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'JOIN_BATCH',
      module: 'STUDENT',
      entityId: student._id,
      newData: {
        batchId,
        status: 'ACTIVE',
        totalFees: monthlyFee,
        dueAmount: monthlyFee,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return response
    res.status(200).json({
      success: true,
      message: 'Student joined batch successfully',
      data: {
        studentId: updatedStudent.studentId,
        studentName: updatedStudent.name || updatedStudent.student?.name,
        batchName: batch.name,
        timeSlot: batch.timeSlot,
        monthlyFee,
        dueAmount: monthlyFee,
        joinDate: updatedStudent.joinDate,
      },
    });
  } catch (error) {
    console.error('Join batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining student to batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Student Data
 * PATCH /api/admin/students/:id
 * POST /api/admin/students/:id/update
 */
const updateStudent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find student and ensure it belongs to the admin's branch
    const student = await Student.findOne({ _id: id, branchId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const oldData = student.toObject();

    // Extract data from nested structure if provided
    let admission = req.body.admission;
    let studentDataFromBody = req.body.student;
    let family_details = req.body.family_details;
    let contact_details = req.body.contact_details;
    let addressData = req.body.address;
    let education = req.body.education;
    let office_use = req.body.office_use;
    const { status, batchId, courseId, totalFees, paidAmount, dueAmount } = req.body;

    // Parse JSON strings if they are strings (from form-data)
    try {
      if (typeof admission === 'string') admission = JSON.parse(admission);
      if (typeof studentDataFromBody === 'string') studentDataFromBody = JSON.parse(studentDataFromBody);
      if (typeof family_details === 'string') family_details = JSON.parse(family_details);
      if (typeof contact_details === 'string') contact_details = JSON.parse(contact_details);
      if (typeof addressData === 'string') addressData = JSON.parse(addressData);
      if (typeof education === 'string') education = JSON.parse(education);
      if (typeof office_use === 'string') office_use = JSON.parse(office_use);
    } catch (parseError) {
      console.warn('Failed to parse some nested fields, using as-is');
    }

    // Update fields if provided
    if (studentDataFromBody?.name) {
      student.studentName = studentDataFromBody.name.trim();
      student.name = studentDataFromBody.name.trim();
    }
    if (studentDataFromBody?.date_of_birth) student.dateOfBirth = new Date(studentDataFromBody.date_of_birth);
    if (studentDataFromBody?.gender) student.gender = studentDataFromBody.gender;
    if (studentDataFromBody?.religion) student.religion = studentDataFromBody.religion;
    if (studentDataFromBody?.caste) student.category = studentDataFromBody.caste;

    if (family_details?.guardian_name) student.guardianName = family_details.guardian_name;
    if (family_details?.mother_name) student.motherName = family_details.mother_name;

    if (contact_details?.mobile) {
      student.mobileNumber = contact_details.mobile;
      student.mobile = contact_details.mobile;
    }
    if (contact_details?.whatsapp) student.whatsappNumber = contact_details.whatsapp;
    if (contact_details?.guardian_contact) student.guardianMobile = contact_details.guardian_contact;
    if (contact_details?.email) {
      const email = contact_details.email.toLowerCase().trim();
      student.email = email;
      if (student.loginCredentials) {
        student.loginCredentials.email = email;
      }
    }

    if (addressData) {
      if (typeof addressData === 'object') {
        const addressParts = [];
        if (addressData.village) addressParts.push(addressData.village);
        if (addressData.post_office) addressParts.push(addressData.post_office);
        if (addressData.district) addressParts.push(addressData.district);
        if (addressData.state) addressParts.push(addressData.state);
        if (addressData.country) addressParts.push(addressData.country);
        student.address = addressParts.join(', ');
        if (addressData.pincode) student.pincode = addressData.pincode;
      } else {
        student.address = addressData;
      }
    }

    if (education?.last_qualification) student.lastQualification = education.last_qualification;

    if (office_use?.form_number) student.formNumber = office_use.form_number;
    if (office_use?.receipt_number) student.receiptNumber = office_use.receipt_number;
    if (office_use?.batch_time) student.batchTime = office_use.batch_time;
    if (office_use?.date) student.officeEntryDate = new Date(office_use.date);

    if (admission?.admission_date) student.admissionDate = new Date(admission.admission_date);
    if (admission?.course?.code) student.courseName = admission.course.code;
    if (admission?.course?.type) student.courseType = admission.course.type;

    if (status) student.status = status;

    // Handle Course/Batch changes if provided directly
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      student.courseId = courseId;
    }

    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
      // If batch changes, update counts
      if (student.batchId && student.batchId.toString() !== batchId.toString()) {
        const oldBatchId = student.batchId;
        student.batchId = batchId;
        // Update counts
        await Batch.findByIdAndUpdate(oldBatchId, { $inc: { currentStudents: -1 } });
        await Batch.findByIdAndUpdate(batchId, { $inc: { currentStudents: 1 } });
      } else if (!student.batchId) {
        student.batchId = batchId;
        await Batch.findByIdAndUpdate(batchId, { $inc: { currentStudents: 1 } });
      }
    }

    if (totalFees !== undefined) student.totalFees = Number(totalFees);
    if (paidAmount !== undefined) student.paidAmount = Number(paidAmount);
    if (dueAmount !== undefined) student.dueAmount = Number(dueAmount);

    // Handle file uploads if any
    if (req.files) {
      if (req.files.studentPhoto?.[0]) student.studentPhoto = req.files.studentPhoto[0].location || req.files.studentPhoto[0].path;
      if (req.files.studentSignature?.[0]) student.studentSignature = req.files.studentSignature[0].location || req.files.studentSignature[0].path;
      if (req.files.officeSignature?.[0]) student.officeSignature = req.files.officeSignature[0].location || req.files.officeSignature[0].path;
      if (req.files.formScanImage?.[0]) student.formScanImage = req.files.formScanImage[0].location || req.files.formScanImage[0].path;
      if (req.files.aadharCardImage?.[0]) student.aadharCardImage = req.files.aadharCardImage[0].location || req.files.aadharCardImage[0].path;
      if (req.files.schoolCertificateImage?.[0]) student.schoolCertificateImage = req.files.schoolCertificateImage[0].location || req.files.schoolCertificateImage[0].path;
    }

    await student.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STUDENT',
      entityId: student._id,
      oldData,
      newData: student.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student update',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Student Data
 * DELETE /api/admin/students/:id
 * POST /api/admin/students/:id/delete
 */
const deleteStudent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find student and ensure it belongs to the admin's branch
    const student = await Student.findOne({ _id: id, branchId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Update batch student count if student was in a batch
    if (student.batchId) {
      await Batch.findByIdAndUpdate(student.batchId, {
        $inc: { currentStudents: -1 },
      });
    }

    // Capture basic info for audit before deletion
    const auditInfo = {
      studentId: student.studentId,
      studentName: student.studentName || student.name,
      mobile: student.mobileNumber || student.mobile
    };

    // Permanently delete student data
    await Student.findByIdAndDelete(id);

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'STUDENT',
      entityId: id,
      oldData: auditInfo,
      newData: null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student deletion',
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
  joinBatch,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
