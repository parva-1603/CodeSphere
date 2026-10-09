const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllProjects,
  forceDeleteProject
} = require('../controllers/admin.controller');

// All admin routes require valid authentication and 'admin' role
router.use(verifyToken, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/projects', getAllProjects);
router.delete('/projects/:id', forceDeleteProject);

module.exports = router;
