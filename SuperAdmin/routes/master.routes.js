const express = require('express');
const router = express.Router();
const {
  createFeeRules,
  createDiscountPolicy,
  createExamRules,
  createCertificateTemplate,
} = require('../controllers/master.controller');
const { createCourse, getCourses, updateCourse, deleteCourse, approveCourse, rejectCourse, getPendingCourses } = require('../controllers/course.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { uploadCourseFiles, handleS3UploadError } = require('../utils/upload');

router.post(
  '/courses',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  uploadCourseFiles,
  handleS3UploadError,
  createCourse
);
router.get('/courses', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getCourses);
router.post(
  '/courses/:id/update',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  uploadCourseFiles,
  handleS3UploadError,
  updateCourse
);
router.post(
  '/courses/:id/delete',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  deleteCourse
);
router.post(
  '/courses/:id/approve',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  approveCourse
);
router.post(
  '/courses/:id/reject',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  rejectCourse
);
router.get(
  '/courses/pending',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  getPendingCourses
);
router.post('/fee-rules', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), createFeeRules);
router.post(
  '/discount-policy',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  createDiscountPolicy
);
router.post('/exam-rules', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), createExamRules);
router.post(
  '/certificate-template',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  createCertificateTemplate
);

module.exports = router;

