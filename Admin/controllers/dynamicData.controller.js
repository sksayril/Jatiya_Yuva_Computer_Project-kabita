const DynamicData = require('../models/dynamicData.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Upload/Create Dynamic Data
 * POST /api/admin/data/upload
 * Store any array or JSON data without fixed schema
 */
const uploadData = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { dataType, title, description, data, tags } = req.body;

    // Validation
    if (!dataType || data === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: dataType, data',
      });
    }

    // Validate data is an object or array
    if (typeof data !== 'object' || data === null) {
      return res.status(400).json({
        success: false,
        message: 'Data must be an object or array',
      });
    }

    // Create dynamic data record
    const dynamicData = await DynamicData.create({
      branchId,
      createdBy: userId,
      dataType: dataType.trim(),
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      data: data, // Can be any JSON structure (object or array)
      tags: tags && Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
      isActive: true,
    });

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'CREATE',
      module: 'DYNAMIC_DATA',
      entityId: dynamicData._id,
      newData: {
        dataType: dynamicData.dataType,
        title: dynamicData.title,
        dataSize: Array.isArray(data) ? data.length : Object.keys(data).length,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Data uploaded successfully',
      data: dynamicData,
    });
  } catch (error) {
    console.error('Upload data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get All Dynamic Data
 * GET /api/admin/data
 * Get all dynamic data records for the authenticated admin
 */
const getData = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { dataType, tag, page = 1, limit = 50, isActive } = req.query;

    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build query
    const query = {
      branchId: branchObjectId,
      createdBy: userObjectId, // Only data created by this admin
    };

    // Filter by dataType
    if (dataType) {
      query.dataType = dataType.trim();
    }

    // Filter by tag
    if (tag) {
      query.tags = tag.trim();
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get data with statistics
    const [dataRecords, total, statistics] = await Promise.all([
      DynamicData.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DynamicData.countDocuments(query),
      DynamicData.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: '$dataType',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            dataType: '$_id',
            count: 1,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        records: dataRecords,
        statistics: {
          totalRecords: total,
          byDataType: statistics,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Dynamic Data by ID
 * GET /api/admin/data/:id
 * Get a specific data record by ID
 */
const getDataById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const dataRecord = await DynamicData.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    }).lean();

    if (!dataRecord) {
      return res.status(404).json({
        success: false,
        message: 'Data record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: dataRecord,
    });
  } catch (error) {
    console.error('Get data by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Data by Type
 * GET /api/admin/data/type/:dataType
 * Get all data records of a specific type
 */
const getDataByType = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { dataType } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const query = {
      branchId: branchObjectId,
      createdBy: userObjectId,
      dataType: dataType.trim(),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [dataRecords, total] = await Promise.all([
      DynamicData.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DynamicData.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dataType: dataType,
        records: dataRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get data by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Dynamic Data
 * POST /api/admin/data/:id/update
 * Update a data record
 */
const updateData = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, data, tags, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const dataRecord = await DynamicData.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    });

    if (!dataRecord) {
      return res.status(404).json({
        success: false,
        message: 'Data record not found',
      });
    }

    // Store old data for audit
    const oldData = {
      title: dataRecord.title,
      description: dataRecord.description,
      data: dataRecord.data,
      tags: dataRecord.tags,
      isActive: dataRecord.isActive,
    };

    // Update fields
    if (title !== undefined) dataRecord.title = title.trim();
    if (description !== undefined) dataRecord.description = description.trim();
    if (data !== undefined) {
      if (typeof data !== 'object' || data === null) {
        return res.status(400).json({
          success: false,
          message: 'Data must be an object or array',
        });
      }
      dataRecord.data = data;
    }
    if (tags !== undefined) {
      dataRecord.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()) : [];
    }
    if (isActive !== undefined) dataRecord.isActive = isActive;

    const updatedRecord = await dataRecord.save();

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'UPDATE',
      module: 'DYNAMIC_DATA',
      entityId: id,
      oldData,
      newData: {
        title: updatedRecord.title,
        description: updatedRecord.description,
        dataSize: Array.isArray(updatedRecord.data) ? updatedRecord.data.length : Object.keys(updatedRecord.data).length,
        tags: updatedRecord.tags,
        isActive: updatedRecord.isActive,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Data updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Dynamic Data
 * POST /api/admin/data/:id/delete
 * Delete a data record
 */
const deleteData = async (req, res) => {
  try {
    const branchId = req.branchId;
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const dataRecord = await DynamicData.findOne({
      _id: id,
      branchId,
      createdBy: userId, // Only if created by this admin
    });

    if (!dataRecord) {
      return res.status(404).json({
        success: false,
        message: 'Data record not found',
      });
    }

    // Store data for audit
    const recordData = {
      dataType: dataRecord.dataType,
      title: dataRecord.title,
    };

    // Delete record
    await DynamicData.findByIdAndDelete(id);

    // Log audit
    await logAudit({
      branchId,
      userId,
      role: req.user.role,
      action: 'DELETE',
      module: 'DYNAMIC_DATA',
      entityId: id,
      oldData: recordData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Data deleted successfully',
    });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadData,
  getData,
  getDataById,
  getDataByType,
  updateData,
  deleteData,
};
