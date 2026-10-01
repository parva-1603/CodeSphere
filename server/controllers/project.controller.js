const Project = require('../models/Project');
const User = require('../models/User');

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
    
    // Only owner can delete
    if (project.owner.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Only the project owner can delete this project' });
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
    
    if (project.owner.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Only the project owner can add collaborators' });
    }
    
    if (project.collaborators.includes(userId)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }
    
    project.collaborators.push(userId);
    await project.save();
    
    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'displayName photoURL email')
      .populate('collaborators', 'displayName photoURL email');
      
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.owner.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Only the project owner can remove collaborators' });
    }
    
    if (project.owner.toString() === userId) {
      return res.status(400).json({ error: 'Cannot remove the owner from the project' });
    }

    project.collaborators = project.collaborators.filter(id => id.toString() !== userId);
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
