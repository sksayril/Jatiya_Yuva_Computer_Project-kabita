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
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate percentage
    const percentage = Math.round((Number(marksObtained) / Number(maxMarks)) * 100);

    // Determine pass/fail
    const status = percentage >= (exam.passingMarks / exam.maxMarks) * 100 ? 'PASS' : 'FAIL';

    // Create or update result
    const result = await Result.findOneAndUpdate(
      { examId, studentId: student._id },
      {
        branchId,
        examId,
        studentId: student._id,
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
      newData: { examId, studentId: student.studentId, marksObtained, status },
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

/**
 * Get Result by ID
 * GET /api/admin/results/:id
 */
const getResultById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const result = await Result.findOne({ _id: id, branchId })
      .populate('examId', 'name examType examDate passingMarks maxMarks')
      .populate('studentId', 'studentId name mobile');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get result by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching result',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Result
 * POST /api/admin/results/:id/update
 */
const updateResult = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { marksObtained, maxMarks, remarks } = req.body;

    const result = await Result.findOne({ _id: id, branchId }).populate('examId');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    const oldData = {
      marksObtained: result.marksObtained,
      maxMarks: result.maxMarks,
      status: result.status,
      percentage: result.percentage,
      remarks: result.remarks,
    };

    // Update marks and recalculate if provided
    if (marksObtained !== undefined) result.marksObtained = Number(marksObtained);
    if (maxMarks !== undefined) result.maxMarks = Number(maxMarks);
    if (remarks !== undefined) result.remarks = remarks.trim();

    if (marksObtained !== undefined || maxMarks !== undefined) {
      const percentage = Math.round((result.marksObtained / result.maxMarks) * 100);
      result.percentage = percentage;

      // Determine pass/fail based on original exam criteria
      if (result.examId) {
        result.status = percentage >= (result.examId.passingMarks / result.examId.maxMarks) * 100 ? 'PASS' : 'FAIL';
      }
    }

    const updatedResult = await result.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'RESULT',
      entityId: id,
      oldData,
      newData: {
        marksObtained: updatedResult.marksObtained,
        maxMarks: updatedResult.maxMarks,
        status: updatedResult.status,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult,
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating result',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Result
 * POST /api/admin/results/:id/delete
 */
const deleteResult = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const result = await Result.findOneAndDelete({ _id: id, branchId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'RESULT',
      entityId: id,
      oldData: {
        examId: result.examId,
        studentId: result.studentId,
        marksObtained: result.marksObtained,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting result',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
};
