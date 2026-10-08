const Notification = require('../models/Notification');
const Project = require('../models/Project');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.uid })
      .populate('sender', 'displayName photoURL email')
      .populate('project', 'name language owner')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const respondToNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to respond to this notification' });
    }

    if (action === 'accept') {
      notification.status = 'accepted';
      await notification.save();

      // Add recipient to project collaborators if not present
      const project = await Project.findById(notification.project);
      if (project) {
        const recipientId = notification.recipient.toString();
        const hasCollab = project.collaborators.some(c => (c._id || c).toString() === recipientId);
        if (!hasCollab) {
          project.collaborators.push(notification.recipient);
          await project.save();
        }
      }
    } else if (action === 'reject') {
      notification.status = 'rejected';
      await notification.save();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updatedNotification = await Notification.findById(id)
      .populate('sender', 'displayName photoURL email')
      .populate('project', 'name language owner');

    res.json(updatedNotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectInvites = async (req, res) => {
  try {
    const { projectId } = req.params;
    const invites = await Notification.find({ project: projectId })
      .populate('recipient', 'displayName photoURL email')
      .populate('sender', 'displayName photoURL email');
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications, respondToNotification, getProjectInvites };
