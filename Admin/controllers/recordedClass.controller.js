const RecordedClass = require('../models/recordedClass.model');
const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Student = require('../models/student.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Create Recorded Class
 * POST /api/admin/recorded-classes
 */
const createRecordedClass = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      batchId,
      courseId,
      title,
      description,
      duration,
      expiryDate,
      allowedStudents,
      allowDownload,
    } = req.body;

    if (!batchId || !courseId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: batchId, courseId, title',
      });
    }

    // Verify batch and course belong to branch
    const [batch, course] = await Promise.all([
      Batch.findOne({ _id: batchId, branchId }),
      Course.findById(courseId),
    ]);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Handle file uploads
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const videoUrl = videoFile.location || videoFile.path;
    const thumbnailUrl = thumbnailFile ? (thumbnailFile.location || thumbnailFile.path) : '';

    // Process allowedStudents - handle string, array of strings (student IDs), or array of ObjectIds
    let allowedStudentIds = [];
    if (allowedStudents) {
      try {
        // Parse if it's a string (JSON stringified array or other formats)
        let parsedStudents = allowedStudents;
        if (typeof allowedStudents === 'string') {
          // Clean up the string - remove brackets and quotes
          let cleaned = allowedStudents.trim();
          
          // Remove outer brackets if present
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            cleaned = cleaned.slice(1, -1).trim();
          }
          
          // Try to parse as JSON first
          try {
            parsedStudents = JSON.parse(`[${cleaned}]`);
          } catch (e) {
            // If not JSON, treat as comma-separated string
            // Remove quotes and split by comma
            parsedStudents = cleaned
              .replace(/['"]/g, '') // Remove single or double quotes
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        }

        // Ensure it's an array
        if (!Array.isArray(parsedStudents)) {
          parsedStudents = [parsedStudents];
        }

        // Filter out empty values
        parsedStudents = parsedStudents.filter(s => s && s.toString().trim() !== '');

        if (parsedStudents.length > 0) {
          // Check if values are ObjectIds or student IDs
          const firstValue = parsedStudents[0].toString().trim();
          const isObjectId = mongoose.Types.ObjectId.isValid(firstValue) && firstValue.length === 24;

          if (isObjectId) {
            // Already ObjectIds, validate and use directly
            allowedStudentIds = parsedStudents
              .map(id => id.toString().trim())
              .filter(id => mongoose.Types.ObjectId.isValid(id))
              .map(id => new mongoose.Types.ObjectId(id));
          } else {
            // Student IDs (strings), need to convert to ObjectIds
            const studentIdList = parsedStudents.map(id => id.toString().trim().toUpperCase());
            const students = await Student.find({
              branchId,
              studentId: { $in: studentIdList },
            }).select('_id studentId');

            allowedStudentIds = students.map(student => student._id);

            // Warn if some student IDs were not found
            if (allowedStudentIds.length !== parsedStudents.length) {
              const foundIds = students.map(s => s.studentId);
              const notFound = studentIdList.filter(id => !foundIds.includes(id));
              console.warn(`Some student IDs not found: ${notFound.join(', ')}`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing allowedStudents:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid allowedStudents format. Provide an array of student IDs or ObjectIds.',
          error: config.isDevelopment() ? error.message : undefined,
        });
      }
    }

    // Create recorded class
    const recordedClass = await RecordedClass.create({
      branchId,
      batchId,
      courseId,
      title: title.trim(),
      description: description?.trim(),
      videoUrl,
      thumbnailUrl,
      duration: duration || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      accessControl: {
        allowedStudents: allowedStudentIds,
        allowDownload: allowDownload || false,
      },
      uploadedBy: req.user.id,
      isActive: true,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'RECORDED_CLASS',
      entityId: recordedClass._id,
      newData: { title, batchId, courseId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Recorded class created successfully',
      data: recordedClass,
    });
  } catch (error) {
    console.error('Create recorded class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Recorded Classes
 * GET /api/admin/recorded-classes
 */
const getRecordedClasses = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { batchId, courseId, isActive } = req.query;

    const query = { branchId };
    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const recordedClasses = await RecordedClass.find(query)
      .populate('batchId', 'name timeSlot')
      .populate('courseId', 'name courseCategory')
      .populate('accessControl.allowedStudents', 'studentId name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: recordedClasses,
    });
  } catch (error) {
    console.error('Get recorded classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recorded classes',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Recorded Class by ID
 * GET /api/admin/recorded-classes/:id
 */
const getRecordedClassById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recorded class ID',
      });
    }

    const recordedClass = await RecordedClass.findOne({ _id: id, branchId })
      .populate('batchId', 'name timeSlot')
      .populate('courseId', 'name courseCategory')
      .populate('accessControl.allowedStudents', 'studentId studentName name')
      .populate('uploadedBy', 'name email');

    if (!recordedClass) {
      return res.status(404).json({
        success: false,
        message: 'Recorded class not found',
      });
    }

    res.status(200).json({
      success: true,
      data: recordedClass,
    });
  } catch (error) {
    console.error('Get recorded class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Recorded Class
 * PUT /api/admin/recorded-classes/:id
 * PATCH /api/admin/recorded-classes/:id
 */
const updateRecordedClass = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const {
      batchId,
      courseId,
      title,
      description,
      duration,
      expiryDate,
      allowedStudents,
      allowDownload,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recorded class ID',
      });
    }

    // Find the recorded class and verify it belongs to the branch
    const recordedClass = await RecordedClass.findOne({ _id: id, branchId });
    if (!recordedClass) {
      return res.status(404).json({
        success: false,
        message: 'Recorded class not found',
      });
    }

    // Store old data for audit
    const oldData = {
      title: recordedClass.title,
      batchId: recordedClass.batchId,
      courseId: recordedClass.courseId,
      isActive: recordedClass.isActive,
    };

    // Handle file uploads (optional - only if new files are provided)
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    // Build update object
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (duration !== undefined) updateData.duration = duration;
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update batch if provided
    if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid batchId',
        });
      }
      const batch = await Batch.findOne({ _id: batchId, branchId });
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found',
        });
      }
      updateData.batchId = batchId;
    }

    // Update course if provided
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid courseId',
        });
      }
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }
      updateData.courseId = courseId;
    }

    // Handle video file update
    if (videoFile) {
      updateData.videoUrl = videoFile.location || videoFile.path;
    }

    // Handle thumbnail file update
    if (thumbnailFile) {
      updateData.thumbnailUrl = thumbnailFile.location || thumbnailFile.path;
    }

    // Process allowedStudents if provided
    if (allowedStudents !== undefined) {
      let allowedStudentIds = [];
      if (allowedStudents) {
        try {
          // Parse if it's a string (JSON stringified array or other formats)
          let parsedStudents = allowedStudents;
          if (typeof allowedStudents === 'string') {
            // Clean up the string - remove brackets and quotes
            let cleaned = allowedStudents.trim();
            
            // Remove outer brackets if present
            if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
              cleaned = cleaned.slice(1, -1).trim();
            }
            
            // Try to parse as JSON first
            try {
              parsedStudents = JSON.parse(`[${cleaned}]`);
            } catch (e) {
              // If not JSON, treat as comma-separated string
              parsedStudents = cleaned
                .replace(/['"]/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
            }
          }

          // Ensure it's an array
          if (!Array.isArray(parsedStudents)) {
            parsedStudents = [parsedStudents];
          }

          // Filter out empty values
          parsedStudents = parsedStudents.filter(s => s && s.toString().trim() !== '');

          if (parsedStudents.length > 0) {
            // Check if values are ObjectIds or student IDs
            const firstValue = parsedStudents[0].toString().trim();
            const isObjectId = mongoose.Types.ObjectId.isValid(firstValue) && firstValue.length === 24;

            if (isObjectId) {
              // Already ObjectIds, validate and use directly
              allowedStudentIds = parsedStudents
                .map(id => id.toString().trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            } else {
              // Student IDs (strings), need to convert to ObjectIds
              const studentIdList = parsedStudents.map(id => id.toString().trim().toUpperCase());
              const students = await Student.find({
                branchId,
                studentId: { $in: studentIdList },
              }).select('_id studentId');

              allowedStudentIds = students.map(student => student._id);

              // Warn if some student IDs were not found
              if (allowedStudentIds.length !== parsedStudents.length) {
                const foundIds = students.map(s => s.studentId);
                const notFound = studentIdList.filter(id => !foundIds.includes(id));
                console.warn(`Some student IDs not found: ${notFound.join(', ')}`);
              }
            }
          }
        } catch (error) {
          console.error('Error processing allowedStudents:', error);
          return res.status(400).json({
            success: false,
            message: 'Invalid allowedStudents format. Provide an array of student IDs or ObjectIds.',
            error: config.isDevelopment() ? error.message : undefined,
          });
        }
      }

      // Update accessControl
      updateData['accessControl.allowedStudents'] = allowedStudentIds;
    }

    // Update allowDownload if provided
    if (allowDownload !== undefined) {
      updateData['accessControl.allowDownload'] = allowDownload;
    }

    // Update the recorded class
    const updatedRecordedClass = await RecordedClass.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('batchId', 'name timeSlot')
      .populate('courseId', 'name courseCategory')
      .populate('accessControl.allowedStudents', 'studentId studentName name')
      .populate('uploadedBy', 'name email');

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'RECORDED_CLASS',
      entityId: id,
      oldData,
      newData: updateData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Recorded class updated successfully',
      data: updatedRecordedClass,
    });
  } catch (error) {
    console.error('Update recorded class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Recorded Class
 * DELETE /api/admin/recorded-classes/:id
 */
const deleteRecordedClass = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recorded class ID',
      });
    }

    // Find the recorded class and verify it belongs to the branch
    const recordedClass = await RecordedClass.findOne({ _id: id, branchId });
    if (!recordedClass) {
      return res.status(404).json({
        success: false,
        message: 'Recorded class not found',
      });
    }

    // Store data for audit before deletion
    const deletedData = {
      title: recordedClass.title,
      batchId: recordedClass.batchId,
      courseId: recordedClass.courseId,
      videoUrl: recordedClass.videoUrl,
    };

    // Delete the recorded class
    await RecordedClass.findByIdAndDelete(id);

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'RECORDED_CLASS',
      entityId: id,
      oldData: deletedData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Recorded class deleted successfully',
    });
  } catch (error) {
    console.error('Delete recorded class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createRecordedClass,
  getRecordedClasses,
  getRecordedClassById,
  updateRecordedClass,
  deleteRecordedClass,
};
