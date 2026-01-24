const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/staff.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createTeacher);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getTeachers);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getTeacherById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateTeacher);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteTeacher);

module.exports = router;

