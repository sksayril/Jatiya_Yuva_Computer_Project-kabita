const express = require('express');
const router = express.Router();
const { createExam, getExams } = require('../controllers/exam.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, createExam);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getExams);

module.exports = router;
