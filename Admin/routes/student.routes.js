const express = require('express');
const router = express.Router();
const {
  manualRegistration,
  scanForm,
  approveStudent,
  dropStudent,
  reactivateStudent,
  changeBatch,
  joinBatch,
  getStudents,
  getStudentById,
} = require('../controllers/student.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadFormImage, uploadStudentFiles } = require('../utils/upload');

router.post('/manual', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadStudentFiles, manualRegistration);
router.post('/scan-form', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadFormImage, scanForm);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudents);
router.post('/:id/approve', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, approveStudent);
router.post('/:id/drop', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, dropStudent);
router.post('/:id/reactivate', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, reactivateStudent);
router.post('/:id/change-batch', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, changeBatch);
router.post('/:id/join-batch', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, joinBatch);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getStudentById);

module.exports = router;
