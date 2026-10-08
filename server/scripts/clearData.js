const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '../.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} else if (fs.existsSync(path.join(__dirname, '../../.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

async function clearAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const resUsers = await User.deleteMany({});
    const resProjects = await Project.deleteMany({});
    const resNotifs = await Notification.deleteMany({});

    console.log(`Deleted ${resUsers.deletedCount} users.`);
    console.log(`Deleted ${resProjects.deletedCount} projects.`);
    console.log(`Deleted ${resNotifs.deletedCount} notifications.`);

    await mongoose.disconnect();
    console.log('Database cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearAll();
