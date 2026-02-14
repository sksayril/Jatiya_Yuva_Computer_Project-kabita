const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Staff = require('../models/staff.model');
const Teacher = require('../models/teacher.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Batch
 * POST /api/admin/batches
 */
const createBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { name, timeSlot, monthlyFee, isKidsBatch, discountPercentage, teacherId, courseId, maxStudents, weekdays } = req.body;

    if (!name || !timeSlot || !courseId || !weekdays) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, timeSlot, courseId, weekdays',
      });
    }

    // Validate weekdays
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!Array.isArray(weekdays) || weekdays.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'weekdays must be a non-empty array',
      });
    }

    // Normalize and validate weekday names
    const normalizedWeekdays = weekdays.map(day => {
      const trimmed = day.trim();
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      if (!validDays.includes(capitalized)) {
        return null;
      }
      return capitalized;
    }).filter(day => day !== null);

    if (normalizedWeekdays.length === 0 || normalizedWeekdays.length !== weekdays.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekdays. Valid days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
      });
    }

    // Sort weekdays for consistent comparison
    const sortedWeekdays = normalizedWeekdays.sort((a, b) => {
      const dayOrder = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      return dayOrder[a] - dayOrder[b];
    });

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Use course monthlyFees if monthlyFee is not provided
    const batchMonthlyFee = monthlyFee !== undefined ? Number(monthlyFee) : (course.monthlyFees || null);

    // Check for duplicate batch with same timeSlot and weekdays in the same branch
    // Normalize timeSlot for comparison (trim and case-insensitive)
    const normalizedTimeSlot = timeSlot.trim().toLowerCase();
    
    // Find all active batches in the branch
    const allBatches = await Batch.find({
      branchId,
      isActive: true,
    });
    
    // Check for exact match of timeSlot (case-insensitive) and same weekdays
    const existingBatch = allBatches.find(batch => {
      const batchTimeSlot = (batch.timeSlot || '').trim().toLowerCase();
      const batchWeekdays = Array.isArray(batch.weekdays) ? [...batch.weekdays].sort() : [];
      const checkWeekdays = [...sortedWeekdays].sort();
      
      return batchTimeSlot === normalizedTimeSlot &&
             batchWeekdays.length === checkWeekdays.length &&
             batchWeekdays.every((day, idx) => day === checkWeekdays[idx]);
    });

    if (existingBatch) {
      return res.status(409).json({
        success: false,
        message: `A batch with the same time slot (${timeSlot}) and weekdays (${sortedWeekdays.join(', ')}) already exists in this branch`,
        existingBatch: {
          _id: existingBatch._id,
          name: existingBatch.name,
          timeSlot: existingBatch.timeSlot,
          weekdays: existingBatch.weekdays,
        },
      });
    }

    // Verify teacher if provided
    if (teacherId) {
      const teacher = await Teacher.findOne({ _id: teacherId, branchId });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

    // For kids batch, discount is locked (read-only)
    let finalDiscountPercentage = 0;
    if (isKidsBatch) {
      finalDiscountPercentage = discountPercentage || 10; // Default 10% for kids
    } else {
      finalDiscountPercentage = discountPercentage || 0;
    }

    // Create batch
    const batch = await Batch.create({
      branchId,
      name: name.trim(),
      timeSlot: timeSlot.trim(),
      weekdays: sortedWeekdays,
      monthlyFee: batchMonthlyFee, // Use provided monthlyFee or course monthlyFees
      isKidsBatch: isKidsBatch || false,
      discountPercentage: finalDiscountPercentage,
      teacherId: teacherId || null,
      courseId,
      maxStudents: maxStudents || 30,
      currentStudents: 0,
      isActive: true,
    });

    // Update teacher's assigned batches if teacher provided
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $addToSet: { assignedBatches: batch._id },
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'BATCH',
      entityId: batch._id,
      newData: { name, timeSlot, isKidsBatch },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: populatedBatch,
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Batch by ID
 * GET /api/admin/batches/:id
 */
const getBatchById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const batch = await Batch.findOne({ _id: id, branchId })
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('Get batch by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Batches
 * GET /api/admin/batches
 */
const getBatches = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { courseId, isActive, isKidsBatch } = req.query;

    const query = { branchId };
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isKidsBatch !== undefined) query.isKidsBatch = isKidsBatch === 'true';

    const batches = await Batch.find(query)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Batch
 * PATCH /api/admin/batches/:id
 */
const updateBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const update = {};

    const allowedFields = ['name', 'timeSlot', 'monthlyFee', 'teacherId', 'maxStudents', 'isActive', 'weekdays'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    // Validate and normalize weekdays if provided
    if (update.weekdays !== undefined) {
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (!Array.isArray(update.weekdays) || update.weekdays.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'weekdays must be a non-empty array',
        });
      }

      const normalizedWeekdays = update.weekdays.map(day => {
        const trimmed = day.trim();
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        if (!validDays.includes(capitalized)) {
          return null;
        }
        return capitalized;
      }).filter(day => day !== null);

      if (normalizedWeekdays.length === 0 || normalizedWeekdays.length !== update.weekdays.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid weekdays. Valid days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
        });
      }

      // Sort weekdays for consistent comparison
      const dayOrder = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      update.weekdays = normalizedWeekdays.sort((a, b) => dayOrder[a] - dayOrder[b]);
    }

    // Verify teacher if provided
    if (req.body.teacherId) {
      const teacher = await Teacher.findOne({ _id: req.body.teacherId, branchId });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

    // Kids batch discount is read-only, don't allow changes
    if (req.body.discountPercentage !== undefined) {
      const existingBatch = await Batch.findOne({ _id: id, branchId });
      if (existingBatch && existingBatch.isKidsBatch) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage is locked for kids batches',
        });
      }
      update.discountPercentage = req.body.discountPercentage;
    }

    // Check for duplicate batch with same timeSlot and weekdays if timeSlot or weekdays are being updated
    if (update.timeSlot || update.weekdays) {
      const existingBatch = await Batch.findOne({ _id: id, branchId });
      if (!existingBatch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      const checkTimeSlot = update.timeSlot ? update.timeSlot.trim().toLowerCase() : existingBatch.timeSlot.toLowerCase();
      const checkWeekdays = update.weekdays || existingBatch.weekdays;

      // Find all active batches in the branch (excluding current batch)
      const allBatches = await Batch.find({
        branchId,
        _id: { $ne: id },
        isActive: true,
      });
      
      // Check for exact match of timeSlot (case-insensitive) and same weekdays
      const duplicateBatch = allBatches.find(batch => {
        const batchTimeSlot = (batch.timeSlot || '').trim().toLowerCase();
        const batchWeekdays = Array.isArray(batch.weekdays) ? [...batch.weekdays].sort() : [];
        const checkWeekdaysSorted = [...checkWeekdays].sort();
        
        return batchTimeSlot === checkTimeSlot.toLowerCase() &&
               batchWeekdays.length === checkWeekdaysSorted.length &&
               batchWeekdays.every((day, idx) => day === checkWeekdaysSorted[idx]);
      });

      if (duplicateBatch) {
        return res.status(409).json({
          success: false,
          message: `A batch with the same time slot (${update.timeSlot || existingBatch.timeSlot}) and weekdays (${checkWeekdays.join(', ')}) already exists in this branch`,
          existingBatch: {
            _id: duplicateBatch._id,
            name: duplicateBatch.name,
            timeSlot: duplicateBatch.timeSlot,
            weekdays: duplicateBatch.weekdays,
          },
        });
      }
    }

    const batch = await Batch.findOneAndUpdate(
      { _id: id, branchId },
      update,
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'BATCH',
      entityId: batch._id,
      newData: update,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: populatedBatch,
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Batch
 * POST /api/admin/batches/:id/delete
 */
const deleteBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find and verify batch belongs to admin's branch
    const batch = await Batch.findOne({ _id: id, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Check if batch has students
    const studentCount = batch.currentStudents || 0;
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with active students. Current students: ${studentCount}`,
      });
    }

    // Store old data for audit log
    const oldData = {
      name: batch.name,
      timeSlot: batch.timeSlot,
      monthlyFee: batch.monthlyFee,
      teacherId: batch.teacherId,
      courseId: batch.courseId,
      maxStudents: batch.maxStudents,
    };

    // Delete batch
    await Batch.findByIdAndDelete(id);

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'BATCH',
      entityId: id,
      oldData,
      newData: null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Assign Teacher to Batch
 * POST /api/admin/batches/:id/assign-teacher
 */
const assignTeacherToBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacherId',
      });
    }

    // Verify batch exists
    const batch = await Batch.findOne({ _id: id, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Verify teacher exists and belongs to same branch
    const teacher = await Teacher.findOne({ _id: teacherId, branchId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Store old teacher ID for audit log
    const oldTeacherId = batch.teacherId;

    // Remove batch from old teacher's assigned batches if exists
    if (oldTeacherId) {
      await Teacher.findByIdAndUpdate(oldTeacherId, {
        $pull: { assignedBatches: batch._id },
      });
    }

    // Update batch with new teacher
    batch.teacherId = teacherId;
    await batch.save();

    // Add batch to new teacher's assigned batches
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedBatches: batch._id },
    });

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'ASSIGN',
      module: 'BATCH',
      entityId: batch._id,
      oldData: { teacherId: oldTeacherId },
      newData: { teacherId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Teacher assigned to batch successfully',
      data: populatedBatch,
    });
  } catch (error) {
    console.error('Assign teacher to batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning teacher to batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  assignTeacherToBatch,
};
