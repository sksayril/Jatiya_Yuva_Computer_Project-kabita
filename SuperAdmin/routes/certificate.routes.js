const express = require('express');
const router = express.Router();
const {
  createCertificateTemplate,
  createCertificateRules,
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

module.exports = router;

