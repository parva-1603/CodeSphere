const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/codesphere')
  .then(async () => {
    try {
      const email = 'test@example.com';
      const name = '';
      
      const user = new User({
        email,
        password: 'hashedPassword',
        displayName: (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User',
      });
      
      const error = user.validateSync();
      if (error) {
        console.error('Validation Error:', error.message);
      } else {
        console.log('Validation Passed! displayName is:', user.displayName);
      }
    } catch (e) {
      console.error('Caught error:', e.message);
    }
    mongoose.disconnect();
  });
