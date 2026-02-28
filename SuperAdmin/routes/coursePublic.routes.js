const express = require('express');
const router = express.Router();
const {
  getApprovedCourses,
  getApprovedCourseById,
  getCourseCategories,
} = require('../controllers/coursePublic.controller');

// Public routes - no authentication required
router.get('/', getApprovedCourses);
router.get('/categories', getCourseCategories);
router.get('/:id', getApprovedCourseById);

module.exports = router;
