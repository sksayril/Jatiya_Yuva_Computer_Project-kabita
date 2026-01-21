const Exam = require('../../Admin/models/exam.model');
const Result = require('../../Admin/models/result.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Get Student Exams
 * GET /api/student/exams
 */
const getExams = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { status = 'all' } = req.query; // all, upcoming, past

    const student = await Student.findById(studentId).select('courseId batchId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Build query
    const query = {
      branchId,
      status: 'ACTIVE',
      $or: [
        { courseId: student.courseId },
        { batchId: student.batchId },
        { targetStudents: studentId },
        { targetStudents: { $size: 0 } }, // All students
      ],
    };

    // Filter by status
    const now = new Date();
    if (status === 'upcoming') {
      query.examDate = { $gte: now };
    } else if (status === 'past') {
      query.examDate = { $lt: now };
    }

    const exams = await Exam.find(query)
      .populate('courseId', 'name')
      .populate('batchId', 'name timeSlot')
      .sort({ examDate: 1 })
      .select('-targetStudents'); // Don't expose target students list

    // Get results for past exams
    const examIds = exams.map((e) => e._id);
    const results = await Result.find({
      branchId,
      studentId,
      examId: { $in: examIds },
    });

    const resultsMap = {};
    results.forEach((r) => {
      resultsMap[r.examId.toString()] = {
        marksObtained: r.marksObtained,
        maxMarks: r.maxMarks,
        percentage: r.percentage,
        status: r.status,
        remarks: r.remarks,
      };
    });

    // Enrich exams with results
    const enrichedExams = exams.map((exam) => {
      const examObj = exam.toObject();
      const result = resultsMap[exam._id.toString()];
      
      return {
        ...examObj,
        result: result || null,
        isUpcoming: new Date(exam.examDate) >= now,
        canAppear: !result && new Date(exam.examDate) >= now, // Can appear if no result and exam is upcoming
      };
    });

    res.status(200).json({
      success: true,
      data: {
        exams: enrichedExams,
        summary: {
          total: enrichedExams.length,
          upcoming: enrichedExams.filter((e) => e.isUpcoming).length,
          past: enrichedExams.filter((e) => !e.isUpcoming).length,
          withResults: enrichedExams.filter((e) => e.result).length,
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

module.exports = {
  getExams,
};
