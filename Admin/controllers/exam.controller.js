const Exam = require('../models/exam.model');
const Course = require('../../SuperAdmin/models/course.model');
const Teacher = require('../models/teacher.model');
const Batch = require('../models/batch.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Create Exam
 * POST /api/admin/exams
 */
const createExam = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      examType,
      courseId,
      batchId,
      teacherId,
      examDate,
      maxMarks,
      passingMarks,
    } = req.body;

    if (!name || !examType || !courseId || !examDate || !maxMarks || !passingMarks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, examType, courseId, examDate, maxMarks, passingMarks',
      });
    }

    if (!['MONTHLY', '6M', '1Y'].includes(examType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid examType. Allowed: MONTHLY, 6M, 1Y',
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Verify teacher exists and belongs to branch (if teacherId provided)
    // Handle both ObjectId and teacher ID string (e.g., "DHK006-TCH-002")
    let teacher = null;
    let teacherObjectId = null;
    if (teacherId) {
      if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
        // teacherId is an ObjectId
        teacher = await Teacher.findOne({ _id: teacherId, branchId });
        if (teacher) {
          teacherObjectId = teacher._id;
        }
      } else {
        // teacherId is a teacher ID string (e.g., "DHK006-TCH-002")
        teacher = await Teacher.findOne({
          teacherId: teacherId.toUpperCase().trim(),
          branchId,
        });
        if (teacher) {
          teacherObjectId = teacher._id;
        }
      }

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found or does not belong to this branch',
        });
      }

      if (!teacher.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Teacher is inactive',
        });
      }
    }

    // Verify batch exists and belongs to branch (if batchId provided)
    if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid batchId format',
        });
      }
      const batch = await Batch.findOne({ _id: batchId, branchId });
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found or does not belong to this branch',
        });
      }
    }

    // Create exam
    const exam = await Exam.create({
      branchId,
      name: name.trim(),
      examType,
      courseId,
      batchId: batchId || null,
      teacherId: teacherObjectId || null,
      examDate: new Date(examDate),
      maxMarks: Number(maxMarks),
      passingMarks: Number(passingMarks),
      isActive: true,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'EXAM',
      entityId: exam._id,
      newData: { name, examType, examDate },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating exam',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Exams
 * GET /api/admin/exams
 */
const getExams = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { examType, courseId, isActive } = req.query;

    const query = { branchId };
    if (examType) query.examType = examType;
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const exams = await Exam.find(query)
      .populate('courseId', 'name courseCategory')
      .populate('batchId', 'name timeSlot')
      .populate('teacherId', 'teacherId name email')
      .sort({ examDate: -1 });

    res.status(200).json({
      success: true,
      data: exams,
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
 * Get Exam by ID
 * GET /api/admin/exams/:id
 */
const getExamById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const exam = await Exam.findOne({ _id: id, branchId })
      .populate('courseId', 'name courseCategory')
      .populate('batchId', 'name timeSlot')
      .populate('teacherId', 'teacherId name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Exam
 * POST /api/admin/exams/:id/update
 */
const updateExam = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const {
      name,
      examType,
      courseId,
      batchId,
      teacherId,
      examDate,
      maxMarks,
      passingMarks,
      isActive,
    } = req.body;

    const exam = await Exam.findOne({ _id: id, branchId });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const oldData = {
      name: exam.name,
      examType: exam.examType,
      courseId: exam.courseId,
      batchId: exam.batchId,
      teacherId: exam.teacherId,
      examDate: exam.examDate,
      maxMarks: exam.maxMarks,
      passingMarks: exam.passingMarks,
      isActive: exam.isActive,
    };

    // Update fields if provided
    if (name) exam.name = name.trim();
    if (examType) {
      if (!['MONTHLY', '6M', '1Y'].includes(examType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid examType. Allowed: MONTHLY, 6M, 1Y',
        });
      }
      exam.examType = examType;
    }
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      exam.courseId = courseId;
    }
    if (batchId !== undefined) {
      if (batchId) {
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid batchId format',
          });
        }
        const batch = await Batch.findOne({ _id: batchId, branchId });
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: 'Batch not found or does not belong to this branch',
          });
        }
      }
      exam.batchId = batchId || null;
    }
    if (teacherId !== undefined) {
      if (teacherId) {
        let teacher = null;
        let teacherObjectId = null;
        
        // Handle both ObjectId and teacher ID string (e.g., "DHK006-TCH-002")
        if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
          // teacherId is an ObjectId
          teacher = await Teacher.findOne({ _id: teacherId, branchId });
          if (teacher) {
            teacherObjectId = teacher._id;
          }
        } else {
          // teacherId is a teacher ID string (e.g., "DHK006-TCH-002")
          teacher = await Teacher.findOne({
            teacherId: teacherId.toUpperCase().trim(),
            branchId,
          });
          if (teacher) {
            teacherObjectId = teacher._id;
          }
        }

        if (!teacher) {
          return res.status(404).json({
            success: false,
            message: 'Teacher not found or does not belong to this branch',
          });
        }

        if (!teacher.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Teacher is inactive',
          });
        }

        exam.teacherId = teacherObjectId;
      } else {
        exam.teacherId = null;
      }
    }
    if (examDate) exam.examDate = new Date(examDate);
    if (maxMarks !== undefined) exam.maxMarks = Number(maxMarks);
    if (passingMarks !== undefined) exam.passingMarks = Number(passingMarks);
    if (isActive !== undefined) exam.isActive = isActive;

    const updatedExam = await exam.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'EXAM',
      entityId: id,
      oldData,
      newData: { name, examType, examDate, isActive },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: updatedExam,
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating exam',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Exam
 * POST /api/admin/exams/:id/delete
 */
const deleteExam = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const exam = await Exam.findOneAndDelete({ _id: id, branchId });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'EXAM',
      entityId: id,
      oldData: { name: exam.name, examType: exam.examType },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting exam',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Assign Teacher to Exam
 * POST /api/admin/exams/:id/assign-teacher
 */
const assignTeacherToExam = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: teacherId',
      });
    }

    // Find exam
    const exam = await Exam.findOne({ _id: id, branchId });
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Verify teacher exists and belongs to branch
    // Handle both ObjectId and teacher ID string (e.g., "DHK006-TCH-002")
    let teacher = null;
    let teacherObjectId = null;
    
    if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
      // teacherId is an ObjectId
      teacher = await Teacher.findOne({ _id: teacherId, branchId });
      if (teacher) {
        teacherObjectId = teacher._id;
      }
    } else {
      // teacherId is a teacher ID string (e.g., "DHK006-TCH-002")
      teacher = await Teacher.findOne({
        teacherId: teacherId.toUpperCase().trim(),
        branchId,
      });
      if (teacher) {
        teacherObjectId = teacher._id;
      }
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found or does not belong to this branch',
      });
    }

    if (!teacher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is inactive',
      });
    }

    // If exam has a batch, verify teacher is assigned to that batch
    if (exam.batchId) {
      const batch = await Batch.findById(exam.batchId);
      if (batch && batch.teacherId) {
        const batchTeacherId = batch.teacherId.toString();
        const assignedTeacherId = teacherObjectId.toString();
        if (batchTeacherId !== assignedTeacherId) {
          return res.status(400).json({
            success: false,
            message: 'Teacher is not assigned to the exam\'s batch',
            note: 'The exam is for a batch that has a different teacher assigned. Please assign the correct teacher or update the batch assignment.',
          });
        }
      }
    }

    // Store old data for audit
    const oldData = {
      teacherId: exam.teacherId,
    };

    // Update exam with teacher (use ObjectId)
    exam.teacherId = teacherObjectId;
    const updatedExam = await exam.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'ASSIGN_TEACHER',
      module: 'EXAM',
      entityId: id,
      oldData,
      newData: { teacherId: teacherObjectId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populatedExam = await Exam.findById(updatedExam._id)
      .populate('courseId', 'name courseCategory')
      .populate('batchId', 'name timeSlot')
      .populate('teacherId', 'teacherId name email');

    res.status(200).json({
      success: true,
      message: 'Teacher assigned to exam successfully',
      data: populatedExam,
    });
  } catch (error) {
    console.error('Assign teacher to exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning teacher to exam',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  assignTeacherToExam,
};
