const express = require('express');
const router = express.Router();
const { verifyToken, getMe, register, login, googleLogin, searchUsers, updateGithub, disconnectGithub } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', verifyToken, getMe);
router.get('/users/search', verifyToken, searchUsers);
router.post('/github', verifyToken, updateGithub);
router.delete('/github', verifyToken, disconnectGithub);

module.exports = router;
