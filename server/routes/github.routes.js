const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/auth.controller');
const { getRepos, pullFile, pushCommit, pullRepo } = require('../controllers/github.controller');

router.use(verifyToken);
router.get('/repos', getRepos);
router.post('/pull', pullFile);
router.post('/push', pushCommit);
router.post('/pull-repo', pullRepo);

module.exports = router;
