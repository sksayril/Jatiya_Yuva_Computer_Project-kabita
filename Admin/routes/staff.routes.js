const express = require('express');
const router = express.Router();
const { 
  createStaff, 
  createTeacher, 
  getStaff, 
  getStaffById,
  updateStaff,
  deleteStaff,
} = require('../controllers/staff.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Staff routes
router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createStaff);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaff);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStaffById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateStaff);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteStaff);

// Teacher routes
router.post('/teachers', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createTeacher);

module.exports = router;
