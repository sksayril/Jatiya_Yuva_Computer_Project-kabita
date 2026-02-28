const express = require('express');
const router = express.Router();
const {
  uploadData,
  getData,
  getDataById,
  getDataByType,
  updateData,
  deleteData,
} = require('../controllers/dynamicData.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Upload/Create dynamic data
router.post(
  '/upload',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  uploadData
);

// Get all data (with filters)
router.get(
  '/',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  getData
);

// Get data by type (must come before /:id route)
router.get(
  '/type/:dataType',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  getDataByType
);

// Get data by ID
router.get(
  '/:id',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  getDataById
);

// Update data
router.post(
  '/:id/update',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  updateData
);

// Delete data
router.post(
  '/:id/delete',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  deleteData
);

module.exports = router;
