const express = require('express');
const router = express.Router();
const {
  createCertificateTemplate,
  createCertificateRules,
  getCertificates,
} = require('../controllers/certificate.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.post(
  '/template',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  createCertificateTemplate
);
router.post(
  '/rules',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  createCertificateRules
);
router.get(
  '/',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  getCertificates
);

module.exports = router;

