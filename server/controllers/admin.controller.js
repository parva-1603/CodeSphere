const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalNotifications, adminCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ role: 'admin' })
    ]);

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProjects = await Project.find()
      .populate('owner', 'displayName email photoURL')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalProjects,
      totalNotifications,
      adminCount,
      recentUsers,
      recentProjects,
      serverUptime: process.uptime(),
      nodeVersion: process.version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search = '', role = '' } = req.query;
    const query = {};

    if (search.trim()) {
      query.$or = [
        { email: { $regex: search.trim(), $options: 'i' } },
        { displayName: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Attach project count for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const projectCount = await Project.countDocuments({ owner: u._id });
        return {
          ...u.toObject(),
          projectCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "user" or "admin"' });
    }

    if (id === req.user.uid && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot revoke your own admin permissions' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.role = role;
    await targetUser.save();

    const responseUser = targetUser.toObject();
    delete responseUser.password;

    res.json({ message: `Role updated to ${role} successfully`, user: responseUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.uid) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clean up projects owned by this user
    await Project.deleteMany({ owner: targetUser._id });
    // Remove from collaborators
    await Project.updateMany(
      { collaborators: targetUser._id },
      { $pull: { collaborators: targetUser._id } }
    );
    // Delete notifications
    await Notification.deleteMany({
      $or: [{ recipient: targetUser._id }, { sender: targetUser._id }]
    });

    await User.findByIdAndDelete(id);

    res.json({ message: `User ${targetUser.email} and their associated projects were deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/projects
const getAllProjects = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = {};

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('owner', 'displayName email photoURL role')
      .populate('collaborators', 'displayName email photoURL')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/projects/:id
const forceDeleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await Project.findByIdAndDelete(id);
    await Notification.deleteMany({ project: id });

    res.json({ message: `Project "${project.name}" was successfully deleted by admin` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllProjects,
  forceDeleteProject
};
