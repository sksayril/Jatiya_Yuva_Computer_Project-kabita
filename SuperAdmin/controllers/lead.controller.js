const Lead = require('../models/lead.model');
const config = require('../config/env.config');

const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leads',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const getLeadAnalytics = async (req, res) => {
  try {
    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', total: { $sum: 1 } } },
      { $project: { status: '$_id', total: 1, _id: 0 } },
    ]);

    const bySource = await Lead.aggregate([
      { $group: { _id: '$source', total: { $sum: 1 } } },
      { $project: { source: '$_id', total: 1, _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus,
        bySource,
      },
    });
  } catch (error) {
    console.error('Lead analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lead analytics',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getLeads,
  getLeadAnalytics,
};

