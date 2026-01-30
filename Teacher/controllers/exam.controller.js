const Exam = require('../../Admin/models/exam.model');
const Result = require('../../Admin/models/result.model');
const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const { logAudit } = require('../utils/auditLogger');
const { verifyBatchAssignment } = require('../middlewares/batchIsolation.middleware');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Assigned Exams
 * GET /api/teacher/exams
 */
const getExams = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches || [];
    const { status = 'all' } = req.query; // all, upcoming, past

    // Convert assignedBatches to ObjectIds if they're strings
    const assignedBatchIds = assignedBatches.map((batchId) => {
      if (mongoose.Types.ObjectId.isValid(batchId)) {
        return new mongoose.Types.ObjectId(batchId);
      }
      return batchId;
    }).filter(Boolean); // Remove any null/undefined values

    // Build query - exams assigned to this teacher OR exams for assigned batches
    const query = {
      branchId: new mongoose.Types.ObjectId(branchId),
      isActive: true,
    };

    // Build $or condition for teacher or batch assignment
    const orConditions = [];
    
    // Add teacher assignment condition
    if (teacherId) {
      orConditions.push({ teacherId: new mongoose.Types.ObjectId(teacherId) });
    }
    
    // Add batch assignment condition
    if (assignedBatchIds.length > 0) {
      orConditions.push({ batchId: { $in: assignedBatchIds } });
    }

    // Only add $or if we have conditions
    if (orConditions.length > 0) {
      query.$or = orConditions;
    } else {
      // If no conditions, return empty result
      return res.status(200).json({
        success: true,
        data: {
          exams: [],
          summary: {
            total: 0,
            upcoming: 0,
            past: 0,
          },
        },
      });
    }

    // Get all exams first (for summary calculation)
    const allExamsQuery = { ...query };
    const now = new Date();
    
    // Filter by status (upcoming/past) for the actual results
    if (status === 'upcoming') {
      query.examDate = { $gte: now };
    } else if (status === 'past') {
      query.examDate = { $lt: now };
    }

    // Get filtered exams
    const exams = await Exam.find(query)
      .populate('courseId', 'name courseCategory')
      .populate('batchId', 'name timeSlot')
      .populate('teacherId', 'teacherId name email')
      .sort({ examDate: 1 });

    // Get all exams for summary (without date filter)
    const allExams = await Exam.find(allExamsQuery)
      .select('_id examDate')
      .lean();

    // Get results count for each exam
    const examsWithResults = await Promise.all(
      exams.map(async (exam) => {
        const resultsCount = await Result.countDocuments({
          branchId,
          examId: exam._id,
        });

        let studentsInBatch = 0;
        if (exam.batchId) {
          studentsInBatch = await Student.countDocuments({
            branchId,
            batchId: exam.batchId._id || exam.batchId,
            status: 'ACTIVE',
          });
        }

        return {
          ...exam.toObject(),
          resultsUploaded: resultsCount,
          totalStudents: studentsInBatch,
          pendingResults: Math.max(0, studentsInBatch - resultsCount),
          isUpcoming: new Date(exam.examDate) >= now,
        };
      })
    );

    // Calculate summary from all exams
    const upcomingCount = allExams.filter((e) => new Date(e.examDate) >= now).length;
    const pastCount = allExams.filter((e) => new Date(e.examDate) < now).length;

    res.status(200).json({
      success: true,
      data: {
        exams: examsWithResults,
        summary: {
          total: allExams.length,
          upcoming: upcomingCount,
          past: pastCount,
        },
      },
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Upload Marks for Exam
 * POST /api/teacher/exams/:examId/marks
 * Teachers can upload marks ONLY for assigned batches
 */
const uploadMarks = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches;
    const { examId } = req.params;
    const { marks, isDraft = false } = req.body; // Array of { studentId, marksObtained, remarks }

    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: marks (array of student marks)',
      });
    }

    // Get exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Verify exam belongs to branch
    if (exam.branchId.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam does not belong to your branch',
      });
    }

    // Verify batch is assigned to teacher
    if (exam.batchId) {
      try {
        verifyBatchAssignment(exam.batchId, assignedBatches);
      } catch (error) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    }

    // Get students in the batch
    const students = await Student.find({
      branchId,
      batchId: exam.batchId,
      status: 'ACTIVE',
    });

    // Create maps for both ObjectId and studentId string lookups
    const studentByIdMap = {}; // Map by ObjectId string
    const studentByStudentIdMap = {}; // Map by studentId string (e.g., "DHK006-2026-001")
    
    students.forEach((student) => {
      const objectIdString = student._id.toString();
      const studentIdString = student.studentId?.toUpperCase().trim();
      
      studentByIdMap[objectIdString] = student;
      if (studentIdString) {
        studentByStudentIdMap[studentIdString] = student;
      }
    });

    // Validate and process marks
    const results = [];
    const errors = [];

    for (const markData of marks) {
      const { studentId, marksObtained, writtenMarks, mcqMarks, remarks } = markData;

      if (!studentId) {
        errors.push({ studentId: 'Missing', error: 'Student ID is required' });
        continue;
      }

      // Find student by ObjectId or studentId string
      let student = null;
      let studentObjectId = null;
      
      const studentIdString = studentId.toString();
      
      // Check if it's an ObjectId
      if (mongoose.Types.ObjectId.isValid(studentIdString) && studentIdString.length === 24) {
        student = studentByIdMap[studentIdString];
        if (student) {
          studentObjectId = student._id;
        }
      } else {
        // It's a student ID string (e.g., "DHK006-2026-001")
        student = studentByStudentIdMap[studentIdString.toUpperCase().trim()];
        if (student) {
          studentObjectId = student._id;
        }
      }

      // Verify student belongs to batch
      if (!student || !studentObjectId) {
        errors.push({ studentId, error: 'Student not found in this batch' });
        continue;
      }

      // Calculate total marks if writtenMarks and mcqMarks provided
      let totalMarks = marksObtained;
      if (writtenMarks !== undefined && mcqMarks !== undefined) {
        totalMarks = (writtenMarks || 0) + (mcqMarks || 0);
      }

      if (totalMarks === undefined || totalMarks === null) {
        errors.push({ studentId, error: 'Marks obtained is required' });
        continue;
      }

      if (totalMarks < 0 || totalMarks > exam.maxMarks) {
        errors.push({ studentId, error: `Marks must be between 0 and ${exam.maxMarks}` });
        continue;
      }

      // Calculate percentage and status
      const percentage = Math.round((totalMarks / exam.maxMarks) * 100);
      const status = percentage >= exam.passingMarks ? 'PASS' : 'FAIL';

      // Check if result already exists (use ObjectId)
      const existingResult = await Result.findOne({
        branchId,
        examId,
        studentId: studentObjectId,
      });

      if (existingResult) {
        // Update existing result (only if not finalized by admin)
        existingResult.marksObtained = totalMarks;
        existingResult.percentage = percentage;
        existingResult.status = status;
        if (remarks) existingResult.remarks = remarks.trim();
        await existingResult.save();
        results.push(existingResult);
      } else {
        // Create new result (use ObjectId)
        const result = await Result.create({
          branchId,
          examId,
          studentId: studentObjectId,
          marksObtained: totalMarks,
          maxMarks: exam.maxMarks,
          percentage,
          status,
          remarks: remarks?.trim(),
        });
        results.push(result);
      }
    }

    await logAudit({
      branchId,
      userId: teacherId,
      role: 'TEACHER',
      action: 'UPLOAD_MARKS',
      module: 'EXAM',
      entityId: examId,
      newData: { examId, resultsCount: results.length, errorsCount: errors.length },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: `Marks uploaded successfully. ${results.length} result(s) saved.`,
      data: {
        examId,
        examName: exam.name,
        resultsUploaded: results.length,
        errors: errors.length > 0 ? errors : undefined,
        note: isDraft ? 'Marks saved as draft. Admin will review and finalize.' : 'Marks uploaded successfully.',
      },
    });
  } catch (error) {
    console.error('Upload marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading marks',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Exam Marks (View/Edit)
 * GET /api/teacher/exams/:examId/marks
 */
const getExamMarks = async (req, res) => {
  try {
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;
    const { examId } = req.params;

    // Get exam
    const exam = await Exam.findById(examId)
      .populate('batchId', 'name timeSlot')
      .populate('courseId', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Verify batch is assigned to teacher
    if (exam.batchId) {
      try {
        verifyBatchAssignment(exam.batchId._id, assignedBatches);
      } catch (error) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    }

    // Get all students in batch
    const students = await Student.find({
      branchId,
      batchId: exam.batchId,
      status: 'ACTIVE',
    }).select('studentId studentName mobileNumber');

    // Get existing results
    const results = await Result.find({
      branchId,
      examId,
    });

    const resultsMap = {};
    results.forEach((r) => {
      resultsMap[r.studentId.toString()] = {
        marksObtained: r.marksObtained,
        percentage: r.percentage,
        status: r.status,
        remarks: r.remarks,
      };
    });

    // Combine students with their marks
    const studentsWithMarks = students.map((student) => ({
      studentId: student._id,
      studentIdString: student.studentId,
      studentName: student.studentName || student.name,
      mobileNumber: student.mobileNumber || student.mobile,
      marks: resultsMap[student._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          name: exam.name,
          examType: exam.examType,
          examDate: exam.examDate,
          maxMarks: exam.maxMarks,
          passingMarks: exam.passingMarks,
          batch: exam.batchId,
          course: exam.courseId,
        },
        students: studentsWithMarks,
        summary: {
          totalStudents: students.length,
          marksUploaded: results.length,
          pending: students.length - results.length,
        },
      },
    });
  } catch (error) {
    console.error('Get exam marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam marks',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getExams,
  uploadMarks,
  getExamMarks,
};
