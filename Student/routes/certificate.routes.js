const express = require('express');
const router = express.Router();
const { getCertificates, downloadCertificate } = require('../controllers/certificate.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

// Get certificates
router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getCertificates
);

// Download certificate
router.get(
  '/:id/download',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  downloadCertificate
);

module.exports = router;
