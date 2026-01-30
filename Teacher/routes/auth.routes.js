const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/auth.controller');
const { authenticateTeacher } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', authenticateTeacher, logout);

module.exports = router;
