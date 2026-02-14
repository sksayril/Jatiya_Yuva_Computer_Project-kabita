const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Payment = require('../../Admin/models/payment.model');
const Exam = require('../../Admin/models/exam.model');
const Result = require('../../Admin/models/result.model');
const { generateQRCode } = require('../../Admin/utils/qrGenerator');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Profile
 * GET /api/student/profile
 * Comprehensive profile with all student information using aggregation for optimal performance
 */
const getProfile = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Get student with populated course and batch
    const student = await Student.findById(studentId)
      .populate('batchId', 'name timeSlot teacherId')
      .populate({
        path: 'batchId',
        populate: {
          path: 'teacherId',
          select: 'name',
        },
      })
      .populate('courseId', 'name duration courseCategory courseFees')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get teacher name
    const teacherName = student.batchId?.teacherId?.name || null;

    // Generate or retrieve QR code for ID card
    let qrCode = student.qrCode;
    if (!qrCode) {
      const qrData = JSON.stringify({
        studentId: student.studentId,
        branchId: student.branchId.toString(),
        studentName: student.studentName || student.name,
      });
      qrCode = await generateQRCode(qrData);
    }

    // Parallel aggregation queries for optimal performance
    const [
      attendanceStats,
      monthlyAttendance,
      recentAttendance,
      paymentStats,
      examStats,
      resultStats,
    ] = await Promise.all([
      // Overall attendance statistics using aggregation
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },
      ]),

      // Monthly attendance
      (() => {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        return StudentAttendance.aggregate([
          {
            $match: {
              branchId: branchObjectId,
              studentId: studentObjectId,
              date: { $gte: currentMonth, $lt: nextMonth },
            },
          },
          {
            $group: {
              _id: null,
              presentDays: {
                $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              presentDays: 1,
            },
          },
        ]);
      })(),

      // Recent attendance (last 10 records)
      StudentAttendance.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
      })
        .sort({ date: -1 })
        .limit(10)
        .select('date status timeSlot inTime outTime method')
        .lean(),

      // Payment statistics using aggregation
      Payment.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
          },
        },
        {
          $project: {
            _id: 0,
            totalPaid: 1,
          },
        },
      ]),

      // Exam statistics
      (() => {
        const examMatch = {
          branchId: branchObjectId,
          status: 'ACTIVE',
        };
        const orConditions = [];
        if (student.batchId) {
          orConditions.push({
            batchId: new mongoose.Types.ObjectId(student.batchId._id || student.batchId),
          });
        }
        if (student.courseId) {
          orConditions.push({
            courseId: new mongoose.Types.ObjectId(student.courseId._id || student.courseId),
          });
        }
        if (orConditions.length > 0) {
          examMatch.$or = orConditions;
        }
        return Exam.countDocuments(examMatch);
      })(),

      // Result statistics
      Result.countDocuments({
        branchId: branchObjectId,
        studentId: studentObjectId,
      }),
    ]);

    // Process attendance stats
    const attendanceOverall = attendanceStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    const attendanceMonthly = monthlyAttendance[0] || { presentDays: 0 };

    // Calculate attendance status
    let attendanceStatus = 'Poor';
    if (attendanceOverall.percentage >= 90) attendanceStatus = 'Excellent';
    else if (attendanceOverall.percentage >= 80) attendanceStatus = 'Good';
    else if (attendanceOverall.percentage >= 70) attendanceStatus = 'Average';
    else if (attendanceOverall.percentage >= 50) attendanceStatus = 'Needs Improvement';

    // Calculate course progress
    let courseProgress = 0;
    let estimatedDaysRemaining = 0;
    let estimatedCompletionDate = null;

    if (student.courseId && student.courseId.duration) {
      const durationMatch = student.courseId.duration.match(/(\d+)\s*(month|day|week)/i);
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        let totalDays = 0;
        if (unit === 'month') totalDays = value * 30;
        else if (unit === 'week') totalDays = value * 7;
        else totalDays = value;

        if (totalDays > 0) {
          courseProgress = Math.min(
            100,
            Math.round((attendanceOverall.totalDays / totalDays) * 100)
          );
          estimatedDaysRemaining = Math.max(0, totalDays - attendanceOverall.totalDays);
          if (estimatedDaysRemaining > 0) {
            estimatedCompletionDate = new Date();
            estimatedCompletionDate.setDate(
              estimatedCompletionDate.getDate() + estimatedDaysRemaining
            );
          }
        }
      }
    }

    // Process payment stats
    const paymentData = paymentStats[0] || { totalPaid: 0 };
    const totalFees = student.courseId?.courseFees || student.totalFees || 0;
    const paidAmount = paymentData.totalPaid || 0;
    const dueAmount = Math.max(0, totalFees - paidAmount);
    const paymentProgress = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 0;

    // Calculate days since admission
    const admissionDate = student.admissionDate || student.officeEntryDate;
    const daysSinceAdmission = admissionDate
      ? Math.floor((new Date() - new Date(admissionDate)) / (1000 * 60 * 60 * 24))
      : 0;

    // Get exam eligibility
    const examEligibilityThreshold = 75;
    const isExamEligible = attendanceOverall.percentage >= examEligibilityThreshold;

    // Calculate milestones
    const milestones = {
      registered: !!student.studentId,
      active: student.status === 'ACTIVE',
      courseAssigned: !!student.courseId,
      batchAssigned: !!student.batchId,
      firstAttendance: attendanceOverall.totalDays > 0,
      examEligible: isExamEligible,
      courseCompleted: courseProgress >= 100,
    };

    // Build response
    res.status(200).json({
      success: true,
      data: {
        // Personal Information
        studentId: student.studentId,
        studentName: student.studentName || student.name,
        guardianName: student.guardianName,
        motherName: student.motherName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        religion: student.religion,
        category: student.category,

        // Contact Information
        mobileNumber: student.mobileNumber || student.mobile,
        whatsappNumber: student.whatsappNumber,
        guardianMobile: student.guardianMobile,
        email: student.email,

        // Address
        address: student.address,
        pincode: student.pincode,

        // Education
        lastQualification: student.lastQualification,

        // Course & Batch
        course: student.courseId
          ? {
              id: student.courseId._id || student.courseId,
              name: student.courseName || student.courseId.name,
              type: student.courseType || student.courseId.courseCategory,
              duration: student.courseId.duration,
            }
          : null,
        batch: student.batchId
          ? {
              id: student.batchId._id || student.batchId,
              name: student.batchId.name,
              timeSlot: student.batchTime || student.batchId.timeSlot,
              teacherName: teacherName,
            }
          : null,

        // Dates
        admissionDate: student.admissionDate,
        officeEntryDate: student.officeEntryDate,

        // ID Card
        idCard: {
          qrCode: qrCode,
          studentPhoto: student.studentPhoto,
          idCardUrl: student.idCardUrl,
        },

        // Status
        status: student.status,

        // Student Flow Information
        flow: {
          admissionDate: student.admissionDate,
          officeEntryDate: student.officeEntryDate,
          daysSinceAdmission: daysSinceAdmission,
          currentStage: student.status || 'REGISTERED',
          milestones: milestones,
        },

        // Attendance-Based Progress
        attendanceProgress: {
          overall: {
            totalDays: attendanceOverall.totalDays,
            present: attendanceOverall.present,
            absent: attendanceOverall.absent,
            late: attendanceOverall.late,
            percentage: attendanceOverall.percentage,
            status: attendanceStatus,
          },
          monthly: {
            currentMonth: new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            }),
            presentDays: attendanceMonthly.presentDays,
          },
          courseProgress: {
            percentage: courseProgress,
            estimatedDaysRemaining: estimatedDaysRemaining,
            estimatedCompletionDate: estimatedCompletionDate,
          },
          examEligibility: {
            eligible: isExamEligible,
            threshold: examEligibilityThreshold,
            currentPercentage: attendanceOverall.percentage,
            message: isExamEligible
              ? 'You are eligible for exams'
              : `You need ${examEligibilityThreshold - attendanceOverall.percentage}% more attendance to be eligible for exams`,
          },
          recentAttendance: recentAttendance.map((att) => ({
            date: att.date,
            status: att.status,
            timeSlot: att.timeSlot,
            inTime: att.inTime,
            outTime: att.outTime,
            method: att.method,
          })),
        },

        // Payment Progress
        payment: {
          totalFees: totalFees,
          paidAmount: paidAmount,
          dueAmount: dueAmount,
          progress: paymentProgress,
        },

        // Academic Progress
        academic: {
          totalExams: examStats || 0,
          completedExams: resultStats || 0,
          examProgress:
            examStats > 0 ? Math.round((resultStats / examStats) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Download/Print ID Card
 * GET /api/student/profile/id-card
 */
const getIdCard = async (req, res) => {
  try {
    const studentId = req.studentId;

    const student = await Student.findById(studentId).select(
      'studentId studentName qrCode studentPhoto idCardUrl branchId'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Generate QR code if not exists
    let qrCode = student.qrCode;
    if (!qrCode) {
      const qrData = JSON.stringify({
        studentId: student.studentId,
        branchId: student.branchId.toString(),
        studentName: student.studentName || student.name,
      });
      qrCode = await generateQRCode(qrData);
    }

    res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        studentName: student.studentName || student.name,
        qrCode: qrCode,
        studentPhoto: student.studentPhoto,
        idCardUrl: student.idCardUrl,
        note: 'ID card can be downloaded or printed using the provided data',
      },
    });
  } catch (error) {
    console.error('Get ID card error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ID card',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getProfile,
  getIdCard,
};
