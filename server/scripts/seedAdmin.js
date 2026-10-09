const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '../.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codesphere';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const email = 'parva@gmail.com';
    const password = 'Parva@1603';

    let user = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      user.password = hashedPassword;
      user.displayName = 'Parva';
      user.role = 'admin';
      await user.save();
      console.log('Updated Admin account with role: admin for parva@gmail.com successfully.');
    } else {
      user = new User({
        email,
        password: hashedPassword,
        displayName: 'Parva (Admin)',
        role: 'admin',
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=Parva`
      });
      await user.save();
      console.log('Created new Admin account with role: admin for parva@gmail.com successfully.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
};

seedAdmin();
