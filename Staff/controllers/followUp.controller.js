const FollowUp = require('../models/followUp.model');
const Student = require('../../Admin/models/student.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Absent Students
 * GET /api/staff/absent-students
 * Lists students absent today or consecutive days
 */
const getAbsentStudents = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { date, consecutiveDays = 0 } = req.query;

    // Date range for query
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const queryDateEnd = new Date(queryDate);
    queryDateEnd.setHours(23, 59, 59, 999);

    // Get all active students in branch
    const activeStudents = await Student.find({
      branchId,
      status: 'ACTIVE',
    }).select('_id studentId studentName mobileNumber batchId courseName');

    // Get present students for the date
    const presentStudentIds = await StudentAttendance.distinct('studentId', {
      branchId,
      date: { $gte: queryDate, $lte: queryDateEnd },
      status: 'Present',
    });

    // Find absent students
    const absentStudents = activeStudents.filter(
      (student) => !presentStudentIds.some((id) => id.toString() === student._id.toString())
    );

    // If consecutiveDays is specified, filter by consecutive absences
    let result = absentStudents;
    if (consecutiveDays > 0) {
      const consecutiveAbsentStudents = [];
      for (const student of absentStudents) {
        const recentAttendances = await StudentAttendance.find({
          branchId,
          studentId: student._id,
          date: {
            $gte: new Date(queryDate.getTime() - (consecutiveDays - 1) * 24 * 60 * 60 * 1000),
            $lte: queryDateEnd,
          },
        }).sort({ date: -1 });

        const absentCount = recentAttendances.filter((a) => a.status === 'Absent').length;
        if (absentCount >= consecutiveDays) {
          consecutiveAbsentStudents.push({
            ...student.toObject(),
            consecutiveAbsentDays: absentCount,
            dropRisk: absentCount >= 5, // Flag as drop risk if 5+ consecutive days
          });
        }
      }
      result = consecutiveAbsentStudents;
    } else {
      result = absentStudents.map((s) => s.toObject());
    }

    res.status(200).json({
      success: true,
      data: {
        date: queryDate.toISOString().split('T')[0],
        totalAbsent: result.length,
        students: result,
      },
    });
  } catch (error) {
    console.error('Get absent students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching absent students',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Create Follow-up
 * POST /api/staff/follow-ups
 */
const createFollowUp = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const {
      studentId,
      absentDate,
      callStatus,
      reason,
      reasonDetails,
      expectedReturnDate,
      remarks,
      nextFollowUpDate,
    } = req.body;

    // Validation
    if (!studentId || !absentDate || !callStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, absentDate, callStatus, reason',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({
      _id: studentId,
      branchId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to your branch',
      });
    }

    // Create follow-up
    const followUp = await FollowUp.create({
      branchId,
      studentId,
      staffId,
      absentDate: new Date(absentDate),
      callStatus,
      reason,
      reasonDetails: reasonDetails?.trim(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
      remarks: remarks?.trim(),
      followUpStatus: 'Pending',
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
    });

    // Audit log
    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'CREATE_FOLLOW_UP',
      module: 'FOLLOW_UP',
      entityId: followUp._id.toString(),
      newData: { studentId, absentDate, callStatus, reason },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      data: followUp,
    });
  } catch (error) {
    console.error('Create follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating follow-up',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Follow-ups (by staff)
 * GET /api/staff/follow-ups
 */
const getFollowUps = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { status, studentId, page = 1, limit = 20 } = req.query;

    const query = { branchId, staffId };
    if (status) query.followUpStatus = status;
    if (studentId) query.studentId = studentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate('studentId', 'studentId studentName mobileNumber')
        .sort({ absentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUp.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        followUps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow-ups',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Follow-up
 * PATCH /api/staff/follow-ups/:id
 */
const updateFollowUp = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { id } = req.params;
    const {
      callStatus,
      reason,
      reasonDetails,
      expectedReturnDate,
      remarks,
      followUpStatus,
      nextFollowUpDate,
    } = req.body;

    // Find follow-up
    const followUp = await FollowUp.findOne({
      _id: id,
      branchId,
      staffId, // Staff can only update their own follow-ups
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or access denied',
      });
    }

    // Update fields
    const oldData = { ...followUp.toObject() };
    if (callStatus) followUp.callStatus = callStatus;
    if (reason) followUp.reason = reason;
    if (reasonDetails !== undefined) followUp.reasonDetails = reasonDetails?.trim();
    if (expectedReturnDate) followUp.expectedReturnDate = new Date(expectedReturnDate);
    if (remarks !== undefined) followUp.remarks = remarks?.trim();
    if (followUpStatus) followUp.followUpStatus = followUpStatus;
    if (nextFollowUpDate) followUp.nextFollowUpDate = new Date(nextFollowUpDate);
    if (followUpStatus === 'Resolved') {
      followUp.resolvedDate = new Date();
    }

    await followUp.save();

    // Audit log
    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'UPDATE_FOLLOW_UP',
      module: 'FOLLOW_UP',
      entityId: followUp._id.toString(),
      oldData,
      newData: followUp.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp,
    });
  } catch (error) {
    console.error('Update follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating follow-up',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAbsentStudents,
  createFollowUp,
  getFollowUps,
  updateFollowUp,
};
