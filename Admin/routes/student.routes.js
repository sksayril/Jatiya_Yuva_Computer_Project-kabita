const express = require('express');
const router = express.Router();
const {
  manualRegistration,
  scanForm,
  approveStudent,
  dropStudent,
  changeBatch,
  getStudents,
  getStudentById,
} = require('../controllers/student.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadFormImage, uploadStudentFiles } = require('../utils/upload');

router.post('/manual', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadStudentFiles, manualRegistration);
router.post('/scan-form', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadFormImage, scanForm);
router.patch('/:id/approve', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, approveStudent);
router.patch('/:id/drop', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, dropStudent);
router.patch('/:id/change-batch', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, changeBatch);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudents);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentById);

module.exports = router;
