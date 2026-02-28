const Course = require('../models/course.model');
const config = require('../config/env.config');

/**
 * Get All Approved Courses (Public API)
 * GET /api/public/courses
 * No authentication required
 */
const getApprovedCourses = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query filter
    const filter = {
      approvalStatus: 'APPROVED',
      isActive: true,
    };

    // Filter by category if provided
    if (category && ['Basic', 'Advanced', 'Diploma'].includes(category)) {
      filter.courseCategory = category;
    }

    // Search filter (by name or description)
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    const validSortFields = ['name', 'courseCategory', 'courseFees', 'createdAt', 'duration'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    // Get courses
    const courses = await Course.find(filter)
      .select('-createdBy -approvedBy -rejectionReason -__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          category: category || null,
          search: search || null,
          sortBy: sortField,
          sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
        },
      },
    });
  } catch (error) {
    console.error('Get approved courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Single Approved Course by ID (Public API)
 * GET /api/public/courses/:id
 * No authentication required
 */
const getApprovedCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      approvalStatus: 'APPROVED',
      isActive: true,
    })
      .select('-createdBy -approvedBy -rejectionReason -__v')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        course,
      },
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Course Categories (Public API)
 * GET /api/public/courses/categories
 * No authentication required
 */
const getCourseCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      {
        $match: {
          approvalStatus: 'APPROVED',
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$courseCategory',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
        },
      },
      {
        $sort: { category: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Get course categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getApprovedCourses,
  getApprovedCourseById,
  getCourseCategories,
};
