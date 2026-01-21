const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Staff = require('../../Admin/models/staff.model');
const config = require('../config/env.config');

/**
 * Get Course & Batch Details
 * GET /api/student/course
 */
const getCourseDetails = async (req, res) => {
  try {
    const studentId = req.studentId;

    const student = await Student.findById(studentId)
      .populate('courseId', 'name duration courseCategory courseFees description')
      .populate('batchId', 'name timeSlot teacherId isActive');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get teacher name if batch has teacher
    let teacherName = null;
    if (student.batchId?.teacherId) {
      const teacher = await Staff.findById(student.batchId.teacherId).select('name');
      if (teacher) {
        teacherName = teacher.name;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        course: {
          id: student.courseId?._id,
          name: student.courseName || student.courseId?.name,
          type: student.courseType || student.courseId?.courseCategory,
          duration: student.courseId?.duration,
          fees: student.courseId?.courseFees,
          description: student.courseId?.description,
        },
        batch: {
          id: student.batchId?._id,
          name: student.batchId?.name,
          timeSlot: student.batchTime || student.batchId?.timeSlot,
          isActive: student.batchId?.isActive,
          teacherName: teacherName,
        },
        note: 'Course and batch details are read-only. Contact administrator for changes.',
      },
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course details',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getCourseDetails,
};
