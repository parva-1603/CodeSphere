const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getOwnerId = (project) => {
  if (!project || !project.owner) return null;
  return (project.owner._id || project.owner).toString();
};

const createProject = async (req, res) => {
  try {
    const { name, language } = req.body;
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found in db' });

    const project = new Project({
      name,
      language: language || 'javascript',
      owner: user._id,
      collaborators: [user._id]
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { collaborators: user._id }
      ]
    }).populate('owner', 'displayName photoURL email')
      .populate('collaborators', 'displayName photoURL email')
      .sort({ updatedAt: -1 });
      
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'displayName photoURL email')
      .populate('collaborators', 'displayName photoURL email');
      
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    let ownerId = getOwnerId(project);
    if (!ownerId) {
      project.owner = req.user.uid;
      await project.save();
      ownerId = req.user.uid;
    }

    const currentUser = await User.findById(req.user.uid);
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (ownerId !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: 'Only the project owner or an admin can delete this project' });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCollaborator = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    let ownerId = getOwnerId(project);
    if (!ownerId) {
      project.owner = req.user.uid;
      await project.save();
      ownerId = req.user.uid;
    }

    if (ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the project owner can invite collaborators' });
    }
    
    if (project.collaborators.some(id => (id._id || id).toString() === userId)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Check if an invitation notification exists
    let notification = await Notification.findOne({
      recipient: userId,
      project: project._id
    });

    if (notification) {
      if (notification.status === 'pending') {
        return res.status(400).json({ error: 'Invite is already pending for this user' });
      } else if (notification.status === 'accepted') {
        return res.status(400).json({ error: 'User is already a collaborator' });
      } else if (notification.status === 'rejected') {
        // If rejected, ONLY the owner (which req.user.uid is) can resend!
        notification.status = 'pending';
        notification.sender = req.user.uid;
        await notification.save();
      }
    } else {
      notification = new Notification({
        recipient: userId,
        sender: req.user.uid,
        project: project._id,
        status: 'pending'
      });
      await notification.save();
    }
    
    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'displayName photoURL email')
      .populate('collaborators', 'displayName photoURL email');
      
    res.json({ project: updatedProject, message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    let ownerId = getOwnerId(project);
    if (!ownerId) {
      project.owner = req.user.uid;
      await project.save();
      ownerId = req.user.uid;
    }

    if (ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the project owner can remove collaborators' });
    }
    
    if (ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the owner from the project' });
    }

    project.collaborators = project.collaborators.filter(id => (id._id || id).toString() !== userId);
    await project.save();
    
    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'displayName photoURL email')
      .populate('collaborators', 'displayName photoURL email');
      
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createProject, getProjects, getProject, deleteProject, addCollaborator, removeCollaborator };
