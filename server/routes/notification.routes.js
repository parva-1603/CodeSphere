const express = require('express');
const router = express.Router();
const { getNotifications, respondToNotification, getProjectInvites } = require('../controllers/notification.controller');
const { verifyToken } = require('../controllers/auth.controller');

router.get('/', verifyToken, getNotifications);
router.post('/:id/respond', verifyToken, respondToNotification);
router.get('/project/:projectId', verifyToken, getProjectInvites);

module.exports = router;
