const express = require('express');
const router = express.Router();
const {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    assignTeacherToExam,
} = require('../controllers/exam.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createExam);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getExams);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getExamById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateExam);
router.post('/:id/assign-teacher', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, assignTeacherToExam);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteExam);

module.exports = router;
