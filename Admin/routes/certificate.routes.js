const express = require('express');
const router = express.Router();
const { generateCertificate, getCertificates } = require('../controllers/certificate.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, generateCertificate);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getCertificates);

module.exports = router;
