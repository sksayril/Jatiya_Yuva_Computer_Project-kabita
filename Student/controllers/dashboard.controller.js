const Student = require('../../Admin/models/student.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Payment = require('../../Admin/models/payment.model');
const Exam = require('../../Admin/models/exam.model');
const Result = require('../../Admin/models/result.model');
const Certificate = require('../../Admin/models/certificate.model');
const Notice = require('../models/notice.model');
const Course = require('../../SuperAdmin/models/course.model');
const Batch = require('../../Admin/models/batch.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Dashboard Summary
 * GET /api/student/dashboard/summary
 * Comprehensive dashboard with all student information using aggregation for optimal performance
 */
const getDashboardSummary = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Today's date range
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Current month info
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get student with populated course and batch
    const student = await Student.findById(studentId)
      .populate('courseId', 'name courseCategory duration courseFees')
      .populate('batchId', 'name timeSlot teacherId isActive')
      .populate({
        path: 'batchId',
        populate: {
          path: 'teacherId',
          select: 'name',
        },
      })
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Parallel aggregation queries for optimal performance
    const [
      todayAttendance,
      attendanceStats,
      monthlyAttendance,
      recentAttendance,
      paymentStats,
      recentPayments,
      monthlyPayment,
      examStats,
      upcomingExams,
      recentResults,
      certificates,
      recentNotices,
    ] = await Promise.all([
      // Today's attendance
      StudentAttendance.findOne({
        branchId: branchObjectId,
        studentId: studentObjectId,
        date: { $gte: todayStart, $lte: todayEnd },
      }).lean(),

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
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            presentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            totalDays: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            presentDays: 1,
            totalDays: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$presentDays', '$totalDays'] },
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

      // Recent attendance (last 10)
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
            paymentCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalPaid: 1,
            paymentCount: 1,
          },
        },
      ]),

      // Recent payments (last 5)
      Payment.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('amount paymentMode receiptNumber month year createdAt')
        .lean(),

      // Monthly payment status
      Payment.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            month: currentMonth,
            year: currentYear,
          },
        },
        {
          $group: {
            _id: null,
            monthlyPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
          },
        },
        {
          $project: {
            _id: 0,
            monthlyPaid: 1,
          },
        },
      ]),

      // Exam statistics using aggregation
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
        return Exam.aggregate([
          { $match: examMatch },
          {
            $facet: {
              total: [{ $count: 'count' }],
              upcoming: [
                { $match: { examDate: { $gte: today } } },
                { $count: 'count' },
              ],
              past: [
                { $match: { examDate: { $lt: today } } },
                { $count: 'count' },
              ],
            },
          },
        ]);
      })(),

      // Upcoming exams
      (() => {
        const examQuery = {
          branchId: branchObjectId,
          examDate: { $gte: today },
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
          examQuery.$or = orConditions;
        }
        return Exam.find(examQuery)
          .sort({ examDate: 1 })
          .limit(5)
          .select('examName examType examDate maxMarks passingMarks')
          .lean();
      })(),

      // Recent results (last 5)
      Result.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $lookup: {
            from: 'exams',
            localField: 'examId',
            foreignField: '_id',
            as: 'exam',
          },
        },
        {
          $unwind: '$exam',
        },
        {
          $project: {
            _id: 1,
            examName: '$exam.examName',
            examType: '$exam.examType',
            marksObtained: 1,
            maxMarks: 1,
            percentage: 1,
            status: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 5,
        },
      ]),

      // Certificates
      Certificate.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
      })
        .populate('courseId', 'name courseCategory')
        .sort({ issueDate: -1 })
        .lean(),

      // Recent notices
      (() => {
        const noticeQuery = {
          branchId: branchObjectId,
          isActive: true,
          startDate: { $lte: today },
          $and: [
            {
              $or: [
                { targetAudience: 'ALL' },
                {
                  targetAudience: 'STUDENT',
                  targetStudentIds: studentObjectId,
                },
                ...(student.batchId
                  ? [
                      {
                        targetAudience: 'BATCH',
                        targetBatchIds: new mongoose.Types.ObjectId(
                          student.batchId._id || student.batchId
                        ),
                      },
                    ]
                  : []),
                ...(student.courseId
                  ? [
                      {
                        targetAudience: 'COURSE',
                        targetCourseIds: new mongoose.Types.ObjectId(
                          student.courseId._id || student.courseId
                        ),
                      },
                    ]
                  : []),
              ],
            },
            {
              $or: [
                { endDate: { $gte: today } },
                { endDate: { $exists: false } },
              ],
            },
          ],
        };
        return Notice.find(noticeQuery)
          .sort({ priority: -1, createdAt: -1 })
          .limit(5)
          .select('title content noticeType priority createdAt')
          .lean();
      })(),
    ]);

    // Process attendance stats
    const attendanceOverall = attendanceStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    const attendanceMonthly = monthlyAttendance[0] || {
      presentDays: 0,
      totalDays: 0,
      percentage: 0,
    };

    // Calculate attendance status
    let attendanceStatus = 'Poor';
    if (attendanceOverall.percentage >= 90) attendanceStatus = 'Excellent';
    else if (attendanceOverall.percentage >= 80) attendanceStatus = 'Good';
    else if (attendanceOverall.percentage >= 70) attendanceStatus = 'Average';

    // Calculate exam eligibility
    const examEligibilityThreshold = 75;
    const examEligible = attendanceOverall.percentage >= examEligibilityThreshold;

    // Calculate course progress (based on attendance vs expected duration)
    let courseProgress = 0;
    let estimatedDaysRemaining = 0;
    let estimatedCompletionDate = null;

    if (student.courseId && student.courseId.duration) {
      // Parse duration (e.g., "6 months" -> 180 days approximately)
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
            estimatedCompletionDate = new Date(today);
            estimatedCompletionDate.setDate(
              estimatedCompletionDate.getDate() + estimatedDaysRemaining
            );
          }
        }
      }
    }

    // Process payment stats
    const paymentData = paymentStats[0] || { totalPaid: 0, paymentCount: 0 };
    const monthlyPaymentData = monthlyPayment[0] || { monthlyPaid: 0 };
    const monthlyFee = student.monthlyFees || 0;
    const monthlyPaid = monthlyPaymentData.monthlyPaid || 0;
    const totalFees = student.courseId?.courseFees || student.totalFees || 0;
    const paidAmount = paymentData.totalPaid || 0;
    const dueAmount = Math.max(0, totalFees - paidAmount);
    const feeProgress = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 0;
    const monthlyDueAmount = Math.max(0, monthlyFee - monthlyPaid);
    const monthlyFeeStatus = monthlyPaid >= monthlyFee ? 'Paid' : 'Due';

    // Calculate next due date
    let nextDueDate = null;
    if (student.admissionDate) {
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsSinceAdmission =
        (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - admissionDate.getMonth());
      nextDueDate = new Date(admissionDate);
      nextDueDate.setMonth(admissionDate.getMonth() + monthsSinceAdmission + 1);
    }

    // Process exam stats
    const examData = examStats[0] || { total: [], upcoming: [], past: [] };
    const totalExams = examData.total[0]?.count || 0;
    const upcomingExamsCount = examData.upcoming[0]?.count || 0;
    const pastExamsCount = examData.past[0]?.count || 0;
    const completedExams = pastExamsCount;

    // Process results for academic stats
    const resultsData = recentResults || [];
    const totalMarks = resultsData.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
    const totalMaxMarks = resultsData.reduce((sum, r) => sum + (r.maxMarks || 0), 0);
    const overallPercentage =
      totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const examProgress = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

    // Calculate flow/milestones
    const admissionDate = student.admissionDate ? new Date(student.admissionDate) : null;
    const officeEntryDate = student.officeEntryDate
      ? new Date(student.officeEntryDate)
      : admissionDate;
    const daysSinceAdmission = admissionDate
      ? Math.floor((today - admissionDate) / (1000 * 60 * 60 * 24))
      : 0;

    const milestones = {
      registered: !!student.studentId,
      active: student.status === 'ACTIVE',
      courseAssigned: !!student.courseId,
      batchAssigned: !!student.batchId,
      firstAttendance: attendanceOverall.totalDays > 0,
      examEligible: examEligible,
      courseCompleted: courseProgress >= 100,
    };

    // Calculate progress percentage based on milestones
    const milestoneCount = Object.values(milestones).filter(Boolean).length;
    const totalMilestones = Object.keys(milestones).length;
    const progressPercentage = Math.round((milestoneCount / totalMilestones) * 100);

    // Determine next milestone
    let nextMilestone = null;
    if (!milestones.registered) nextMilestone = 'registered';
    else if (!milestones.active) nextMilestone = 'active';
    else if (!milestones.courseAssigned) nextMilestone = 'courseAssigned';
    else if (!milestones.batchAssigned) nextMilestone = 'batchAssigned';
    else if (!milestones.firstAttendance) nextMilestone = 'firstAttendance';
    else if (!milestones.examEligible) nextMilestone = 'examEligible';
    else if (!milestones.courseCompleted) nextMilestone = 'courseCompleted';

    // Certificate eligibility
    const certificateEligibility = [];
    if (student.courseId) {
      const hasCertificate = certificates.some(
        (c) =>
          c.courseId &&
          (c.courseId._id?.toString() === (student.courseId._id || student.courseId).toString() ||
            c.courseId.toString() === (student.courseId._id || student.courseId).toString())
      );

      // Check if all exams passed
      const courseExams = await Exam.find({
        branchId: branchObjectId,
        courseId: student.courseId._id || student.courseId,
        status: 'ACTIVE',
      }).select('_id');

      const courseResults = await Result.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
        examId: { $in: courseExams.map((e) => e._id) },
      });

      const allExamsPassed =
        courseExams.length > 0 &&
        courseResults.length === courseExams.length &&
        courseResults.every((r) => r.status === 'PASS');

      certificateEligibility.push({
        courseId: student.courseId._id || student.courseId,
        courseName: student.courseId.name,
        attendancePercentage: attendanceOverall.percentage,
        requiredAttendance: 75,
        attendanceEligible: attendanceOverall.percentage >= 75,
        allExamsPassed: allExamsPassed,
        eligible: attendanceOverall.percentage >= 75 && allExamsPassed && !hasCertificate,
        message: !hasCertificate
          ? attendanceOverall.percentage >= 75 && allExamsPassed
            ? 'You are eligible for certificate'
            : !allExamsPassed
            ? 'Complete all exams to be eligible for certificate'
            : 'Maintain 75% attendance to be eligible for certificate'
          : 'Certificate already issued',
      });
    }

    // Today's class status
    const todayClassStatus = todayAttendance
      ? {
          status: todayAttendance.status,
          timeSlot: todayAttendance.timeSlot,
          marked: true,
          inTime: todayAttendance.inTime,
          outTime: todayAttendance.outTime,
          method: todayAttendance.method,
          date: todayAttendance.date,
        }
      : {
          status: 'Not Marked',
          timeSlot: student.batchTime || (student.batchId?.timeSlot || 'N/A'),
          marked: false,
          inTime: null,
          outTime: null,
          method: null,
          date: today,
        };

    // Build notifications
    const notifications = [];

    // Due payment notification
    if (monthlyDueAmount > 0) {
      notifications.push({
        type: 'DUE_PAYMENT',
        message: `You have ₹${monthlyDueAmount} due for ${currentMonth}`,
        amount: monthlyDueAmount,
        priority: 'HIGH',
      });
    }

    // Upcoming exams notification
    if (upcomingExams.length > 0) {
      notifications.push({
        type: 'UPCOMING_EXAM',
        message: `${upcomingExams.length} upcoming exam(s)`,
        exams: upcomingExams.map((e) => ({
          name: e.examName,
          type: e.examType,
          date: e.examDate,
        })),
        priority: 'MEDIUM',
      });
    }

    // Exam blocked notification
    if (monthlyDueAmount > 0 && upcomingExams.length > 0) {
      notifications.push({
        type: 'EXAM_BLOCKED',
        message: 'Exams may be blocked due to pending fees',
        priority: 'HIGH',
      });
    }

    // Class reminder
    if (student.batchId) {
      notifications.push({
        type: 'CLASS_REMINDER',
        message: `Today's class: ${student.batchTime || student.batchId?.timeSlot || 'Check schedule'}`,
        batchTime: student.batchTime || student.batchId?.timeSlot,
        priority: 'LOW',
      });
    }

    // Calculate alert summary
    const alertCounts = {
      totalAlerts: notifications.length,
      urgentAlerts: notifications.filter((n) => n.priority === 'URGENT').length,
      highPriorityAlerts: notifications.filter((n) => n.priority === 'HIGH').length,
      mediumPriorityAlerts: notifications.filter((n) => n.priority === 'MEDIUM').length,
      lowPriorityAlerts: notifications.filter((n) => n.priority === 'LOW').length,
    };

    // Build response
    const response = {
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          studentName: student.studentName || student.name,
          email: student.email,
          mobileNumber: student.mobileNumber || student.mobile,
          status: student.status,
          profilePhoto: student.studentPhoto || null,
        },
        flow: {
          admissionDate: student.admissionDate,
          officeEntryDate: student.officeEntryDate || student.admissionDate,
          daysSinceAdmission: daysSinceAdmission,
          currentStage: student.status || 'REGISTERED',
          milestones: milestones,
          nextMilestone: nextMilestone,
          progressPercentage: progressPercentage,
        },
        course: student.courseId
          ? {
              id: student.courseId._id || student.courseId,
              name: student.courseId.name,
              type: student.courseId.courseCategory || 'Certificate',
              duration: student.courseId.duration,
              fees: student.courseId.courseFees || totalFees,
            }
          : null,
        batch: student.batchId
          ? {
              id: student.batchId._id || student.batchId,
              name: student.batchId.name,
              timeSlot: student.batchId.timeSlot,
              teacherName:
                student.batchId.teacherId?.name || 'Not Assigned',
              isActive: student.batchId.isActive !== false,
            }
          : null,
        todayClassStatus: todayClassStatus,
        attendance: {
          overall: {
            totalDays: attendanceOverall.totalDays,
            present: attendanceOverall.present,
            absent: attendanceOverall.absent,
            late: attendanceOverall.late,
            percentage: attendanceOverall.percentage,
            status: attendanceStatus,
          },
          monthly: {
            currentMonth: `${currentMonth} ${currentYear}`,
            presentDays: attendanceMonthly.presentDays,
            totalDays: attendanceMonthly.totalDays,
            percentage: attendanceMonthly.percentage,
          },
          courseProgress: {
            percentage: courseProgress,
            estimatedDaysRemaining: estimatedDaysRemaining,
            estimatedCompletionDate: estimatedCompletionDate,
          },
          examEligibility: {
            eligible: examEligible,
            threshold: examEligibilityThreshold,
            currentPercentage: attendanceOverall.percentage,
            message: examEligible
              ? 'You are eligible for exams'
              : `You need ${examEligibilityThreshold}% attendance to be eligible for exams`,
          },
          recentAttendance: recentAttendance.map((a) => ({
            date: a.date,
            status: a.status,
            timeSlot: a.timeSlot,
            inTime: a.inTime,
            outTime: a.outTime,
            method: a.method,
          })),
        },
        fees: {
          totalFees: totalFees,
          paidAmount: paidAmount,
          dueAmount: dueAmount,
          progress: feeProgress,
          monthlyFees: monthlyFee,
          monthlyFeeStatus: {
            status: monthlyFeeStatus,
            monthlyPaid: monthlyPaid,
            dueAmount: monthlyDueAmount,
            nextDueDate: nextDueDate,
          },
          recentPayments: recentPayments.map((p) => ({
            _id: p._id,
            amount: p.amount,
            paymentMode: p.paymentMode,
            receiptNumber: p.receiptNumber,
            month: p.month,
            year: p.year,
            createdAt: p.createdAt,
          })),
        },
        academic: {
          totalExams: totalExams,
          completedExams: completedExams,
          upcomingExams: upcomingExamsCount,
          examProgress: examProgress,
          overallPercentage: overallPercentage,
          totalMarks: totalMarks,
          totalMaxMarks: totalMaxMarks,
          upcomingExamsList: upcomingExams.map((e) => ({
            _id: e._id,
            examName: e.examName,
            examType: e.examType,
            examDate: e.examDate,
            maxMarks: e.maxMarks,
            passingMarks: e.passingMarks,
            canAppear: examEligible && monthlyDueAmount === 0,
          })),
          recentResults: resultsData.map((r) => ({
            _id: r._id,
            examName: r.examName,
            examType: r.examType,
            marksObtained: r.marksObtained,
            maxMarks: r.maxMarks,
            percentage: r.percentage,
            status: r.status,
          })),
        },
        certificates: {
          totalCertificates: certificates.length,
          eligibleCertificates: certificateEligibility.filter((c) => c.eligible).length,
          eligibilityChecks: certificateEligibility,
        },
        notifications: notifications,
        alerts: alertCounts,
        quickStats: {
          attendancePercentage: attendanceOverall.percentage,
          feeProgress: feeProgress,
          examProgress: examProgress,
          courseProgress: courseProgress,
          daysRemaining: estimatedDaysRemaining,
          examsRemaining: upcomingExamsCount,
        },
        recentNotices: recentNotices.map((n) => ({
          _id: n._id,
          title: n.title,
          content: n.content,
          noticeType: n.noticeType,
          priority: n.priority,
          createdAt: n.createdAt,
        })),
        idCard: {
          hasIdCard: !!(student.idCard || student.qrCode),
          qrCode: student.qrCode || null,
          idCardUrl: student.idCard || null,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Student dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard summary',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardSummary,
};
