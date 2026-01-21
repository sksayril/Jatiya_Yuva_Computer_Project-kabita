const Batch = require('../../Admin/models/batch.model');
const Student = require('../../Admin/models/student.model');
const Course = require('../../SuperAdmin/models/course.model');
const config = require('../config/env.config');

/**
 * Get Batch Details (Read Only)
 * GET /api/teacher/batches
 */
const getBatches = async (req, res) => {
  try {
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;

    const batches = await Batch.find({
      _id: { $in: assignedBatches },
      branchId,
    })
      .populate('courseId', 'name courseCategory duration syllabus description')
      .populate('teacherId', 'name email')
      .sort({ timeSlot: 1, name: 1 });

    // Get student lists for each batch
    const batchesWithStudents = await Promise.all(
      batches.map(async (batch) => {
        const students = await Student.find({
          branchId,
          batchId: batch._id,
          status: 'ACTIVE',
        })
          .select('studentId studentName mobileNumber email')
          .sort({ studentName: 1 });

        return {
          _id: batch._id,
          name: batch.name,
          timeSlot: batch.timeSlot,
          isActive: batch.isActive,
          maxStudents: batch.maxStudents,
          currentStudents: batch.currentStudents,
          course: {
            id: batch.courseId?._id,
            name: batch.courseId?.name,
            category: batch.courseId?.courseCategory,
            duration: batch.courseId?.duration,
            syllabus: batch.courseId?.syllabus,
            description: batch.courseId?.description,
          },
          teacher: batch.teacherId ? {
            id: batch.teacherId._id,
            name: batch.teacherId.name,
            email: batch.teacherId.email,
          } : null,
          students: students.map((s) => ({
            id: s._id,
            studentId: s.studentId,
            name: s.studentName || s.name,
            mobileNumber: s.mobileNumber || s.mobile,
            email: s.email,
          })),
          note: 'Batch details are read-only. Contact administrator for changes.',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        batches: batchesWithStudents,
        totalBatches: batchesWithStudents.length,
      },
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch details',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getBatches,
};
