const express = require('express');
const router = express.Router();
const { runCode } = require('../controllers/run.controller');
const { verifyToken } = require('../controllers/auth.controller');

router.post('/', verifyToken, runCode);

module.exports = router;
