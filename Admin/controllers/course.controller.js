const Course = require('../../SuperAdmin/models/course.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Branch-Level Course
 * POST /api/admin/courses
 */
const createCourse = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      description,
      duration,
      courseCategory,
      courseFees,
      admissionFees,
      monthlyFees,
    } = req.body;

    if (!name || !description || !duration || !courseCategory) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, duration, courseCategory',
      });
    }

    const allowedCategories = ['Basic', 'Advanced', 'Diploma'];
    if (!allowedCategories.includes(courseCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courseCategory. Allowed: Basic, Advanced, Diploma',
      });
    }

    // Check for duplicate course name (case-insensitive)
    const existing = await Course.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Course name already exists',
      });
    }

    // Handle file uploads (if provided)
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    const imageUrl = imageFile ? (imageFile.location || imageFile.path) : '';
    const pdfUrl = pdfFile ? (pdfFile.location || pdfFile.path) : '';

    // Create course
    const course = await Course.create({
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      courseCategory,
      courseFees: Number(courseFees) || 0,
      admissionFees: Number(admissionFees) || 0,
      monthlyFees: Number(monthlyFees) || 0,
      imageUrl: imageUrl || 'https://via.placeholder.com/300',
      pdfUrl: pdfUrl || 'https://via.placeholder.com/document.pdf',
      isActive: true,
      createdBy: 'ADMIN',
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'COURSE',
      entityId: course._id,
      newData: { name, courseCategory },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Courses
 * GET /api/admin/courses
 */
const getCourses = async (req, res) => {
  try {
    const { courseCategory, isActive } = req.query;

    const query = {};
    if (courseCategory) query.courseCategory = courseCategory;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createCourse,
  getCourses,
};
