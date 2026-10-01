const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/auth.controller');
const { chatWithAI } = require('../controllers/ai.controller');

router.use(verifyToken);
router.post('/chat', chatWithAI);

module.exports = router;
