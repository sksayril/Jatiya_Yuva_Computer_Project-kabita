const Payment = require('../models/payment.model');
const Student = require('../models/student.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const getFinanceOverview = async (req, res) => {
  try {
    const totalCollectionAgg = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$discount'] } } } },
    ]);
    const totalCollection = totalCollectionAgg[0]?.total || 0;

    const branchWiseCollection = await Payment.aggregate([
      {
        $group: {
          _id: '$branchId',
          total: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
    ]);

    const dueSummaryAgg = await Student.aggregate([
      { $group: { _id: null, totalDue: { $sum: '$dueAmount' } } },
    ]);
    const dueSummary = dueSummaryAgg[0]?.totalDue || 0;

    const discountSummaryAgg = await Payment.aggregate([
      { $group: { _id: null, totalDiscount: { $sum: '$discount' } } },
    ]);
    const discountSummary = discountSummaryAgg[0]?.totalDiscount || 0;

    res.status(200).json({
      success: true,
      data: {
        totalCollection,
        branchWiseCollection,
        dueSummary,
        discountSummary,
      },
    });
  } catch (error) {
    console.error('Finance overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching finance overview',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const exportFinance = async (req, res) => {
  try {
    const { type } = req.query;
    if (!['pdf', 'excel'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export type. Use pdf or excel',
      });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'EXPORT',
      module: 'FINANCE',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Finance export (${type}) generated`,
    });
  } catch (error) {
    console.error('Finance export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting finance data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getFinanceOverview,
  exportFinance,
};

