const express = require('express');
const router = express.Router();
const { createCourse, getCourses } = require('../controllers/course.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadCourseFiles } = require('../utils/upload');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadCourseFiles, createCourse);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getCourses);

module.exports = router;
