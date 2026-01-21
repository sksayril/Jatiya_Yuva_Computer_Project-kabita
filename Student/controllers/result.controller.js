const Result = require('../../Admin/models/result.model');
const Exam = require('../../Admin/models/exam.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Get Student Results
 * GET /api/student/results
 */
const getResults = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { examId, page = 1, limit = 20 } = req.query;

    const query = { branchId, studentId };
    if (examId) query.examId = examId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Result.find(query)
        .populate('examId', 'examName examType examDate courseId batchId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Result.countDocuments(query),
    ]);

    // Calculate summary statistics
    const passCount = results.filter((r) => r.status === 'PASS').length;
    const failCount = results.filter((r) => r.status === 'FAIL').length;
    const totalMarks = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMaxMarks = results.reduce((sum, r) => sum + r.maxMarks, 0);
    const overallPercentage =
      totalMaxMarks === 0 ? 0 : Math.round((totalMarks / totalMaxMarks) * 100);

    res.status(200).json({
      success: true,
      data: {
        results,
        summary: {
          total,
          pass: passCount,
          fail: failCount,
          overallPercentage,
          totalMarks,
          totalMaxMarks,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
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
  getResults,
};
