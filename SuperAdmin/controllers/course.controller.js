const Course = require('../models/course.model');
const config = require('../config/env.config');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      courseCategory,
      courseFees,
      admissionFees,
      monthlyFees,
    } = req.body;

    if (
      !name ||
      !description ||
      !duration ||
      !courseCategory ||
      courseFees === undefined ||
      admissionFees === undefined ||
      monthlyFees === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: name, description, duration, courseCategory, courseFees, admissionFees, monthlyFees',
      });
    }

    const allowedCategories = ['Basic', 'Advanced', 'Diploma'];
    if (!allowedCategories.includes(courseCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courseCategory. Allowed: Basic, Advanced, Diploma',
      });
    }

    const existing = await Course.findOne({
      name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Course name already exists',
      });
    }

    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (!imageFile || !pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'Both image and pdf files are required',
      });
    }

    // Get S3 URLs - multer-s3 provides location as full S3 URL
    // Format: https://bucket-name.s3.region.amazonaws.com/courses/filename
    const imageUrl = imageFile.location;
    const pdfUrl = pdfFile.location;

    // Verify files were uploaded to S3
    if (!imageUrl || !pdfUrl) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload files to S3. Please check your S3 configuration and system clock.',
      });
    }

    // Ensure URLs are in correct S3 format
    if (!imageUrl.startsWith('http') || !pdfUrl.startsWith('http')) {
      return res.status(500).json({
        success: false,
        message: 'Invalid S3 URL format. Files must be uploaded to AWS S3.',
      });
    }

    const course = await Course.create({
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      courseCategory,
      courseFees: Number(courseFees),
      admissionFees: Number(admissionFees),
      monthlyFees: Number(monthlyFees),
      imageUrl,
      pdfUrl,
      isActive: true,
      createdBy: req.user?.role || 'SUPER_ADMIN',
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        name: course.name,
        courseCategory: course.courseCategory,
        courseFees: course.courseFees,
        imageUrl: course.imageUrl, // S3 URL
        pdfUrl: course.pdfUrl, // S3 URL
      },
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

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    const fields = [
      'name',
      'description',
      'duration',
      'courseCategory',
      'courseFees',
      'admissionFees',
      'monthlyFees',
      'isActive',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (['name', 'description', 'duration'].includes(field)) {
          update[field] = req.body[field].trim();
        } else {
          update[field] = req.body[field];
        }
      }
    });

    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];
    if (imageFile) {
      // Get S3 URL - location is the S3 URL when using multer-s3
      update.imageUrl = imageFile.location || imageFile.path;
      if (!update.imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3 bucket',
        });
      }
    }
    if (pdfFile) {
      // Get S3 URL - location is the S3 URL when using multer-s3
      update.pdfUrl = pdfFile.location || pdfFile.path;
      if (!update.pdfUrl) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload PDF to S3 bucket',
        });
      }
    }

    const course = await Course.findByIdAndUpdate(id, update, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Approve Course Created by Admin
 * POST /api/super-admin/master/courses/:id/approve
 */
const approveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.approvalStatus === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Course is already approved',
      });
    }

    if (course.approvalStatus === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve a rejected course. Please create a new course or contact support.',
      });
    }

    // Update course status
    course.approvalStatus = 'APPROVED';
    course.isActive = true;
    course.approvedBy = req.user.id;
    course.approvedAt = new Date();
    course.rejectionReason = undefined; // Clear rejection reason if any
    await course.save();

    // Log the action
    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'APPROVE_COURSE',
      module: 'COURSE',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Course approved successfully',
      data: {
        _id: course._id,
        name: course.name,
        approvalStatus: course.approvalStatus,
        isActive: course.isActive,
        approvedBy: course.approvedBy,
        approvedAt: course.approvedAt,
      },
    });
  } catch (error) {
    console.error('Approve course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Reject Course Created by Admin
 * POST /api/super-admin/master/courses/:id/reject
 */
const rejectCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.approvalStatus === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already approved course',
      });
    }

    if (course.approvalStatus === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Course is already rejected',
      });
    }

    // Update course status
    course.approvalStatus = 'REJECTED';
    course.isActive = false;
    course.approvedBy = req.user.id;
    course.approvedAt = new Date();
    course.rejectionReason = rejectionReason.trim();
    await course.save();

    // Log the action
    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'REJECT_COURSE',
      module: 'COURSE',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Course rejected successfully',
      data: {
        _id: course._id,
        name: course.name,
        approvalStatus: course.approvalStatus,
        isActive: course.isActive,
        approvedBy: course.approvedBy,
        approvedAt: course.approvedAt,
        rejectionReason: course.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Reject course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Pending Courses (for approval)
 * GET /api/super-admin/master/courses/pending
 */
const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ approvalStatus: 'PENDING' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('Get pending courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending courses',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  approveCourse,
  rejectCourse,
  getPendingCourses,
};

