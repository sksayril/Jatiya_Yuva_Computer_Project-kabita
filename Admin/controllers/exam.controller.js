const Exam = require('../models/exam.model');
const Course = require('../../SuperAdmin/models/course.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

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

    // Create exam
    const exam = await Exam.create({
      branchId,
      name: name.trim(),
      examType,
      courseId,
      batchId: batchId || null,
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

module.exports = {
  createExam,
  getExams,
};
