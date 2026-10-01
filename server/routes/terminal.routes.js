const express = require('express');
const router = express.Router();
const { executeCommand } = require('../controllers/terminal.controller');
const { verifyToken } = require('../controllers/auth.controller');

router.post('/execute', verifyToken, executeCommand);

module.exports = router;
