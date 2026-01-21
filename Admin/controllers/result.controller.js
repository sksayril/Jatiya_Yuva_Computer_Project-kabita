const Result = require('../models/result.model');
const Exam = require('../models/exam.model');
const Student = require('../models/student.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create/Update Result
 * POST /api/admin/results
 */
const createResult = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { examId, studentId, marksObtained, maxMarks, remarks } = req.body;

    if (!examId || !studentId || marksObtained === undefined || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: examId, studentId, marksObtained, maxMarks',
      });
    }

    // Verify exam belongs to branch
    const exam = await Exam.findOne({ _id: examId, branchId });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate percentage
    const percentage = Math.round((Number(marksObtained) / Number(maxMarks)) * 100);
    
    // Determine pass/fail
    const status = percentage >= (exam.passingMarks / exam.maxMarks) * 100 ? 'PASS' : 'FAIL';

    // Create or update result
    const result = await Result.findOneAndUpdate(
      { examId, studentId },
      {
        branchId,
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        maxMarks: Number(maxMarks),
        percentage,
        status,
        remarks: remarks?.trim(),
      },
      { new: true, upsert: true }
    );

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'RESULT',
      entityId: result._id,
      newData: { examId, studentId, marksObtained, status },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Result recorded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording result',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Results
 * GET /api/admin/results
 */
const getResults = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { examId, studentId, status } = req.query;

    const query = { branchId };
    if (examId) query.examId = examId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const results = await Result.find(query)
      .populate('examId', 'name examType examDate')
      .populate('studentId', 'studentId name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createResult,
  getResults,
};
