const express = require('express');
const router = express.Router();
const { createRecordedClass, getRecordedClasses } = require('../controllers/recordedClass.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadVideo } = require('../utils/upload');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadVideo, createRecordedClass);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getRecordedClasses);

module.exports = router;
