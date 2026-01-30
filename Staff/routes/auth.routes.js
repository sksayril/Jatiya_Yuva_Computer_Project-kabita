const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/auth.controller');
const { authenticateStaff } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', authenticateStaff, logout);

module.exports = router;
