const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/auth.controller');
const { createProject, getProjects, getProject, deleteProject, addCollaborator, removeCollaborator } = require('../controllers/project.controller');

router.use(verifyToken);
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

module.exports = router;
