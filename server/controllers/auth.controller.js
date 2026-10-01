const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_key_2026';

const generateToken = (userId) => {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      displayName: (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email || 'User')}`
    });

    await user.save();

    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { email, name, photoURL, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Missing required Google profile data' });
    }

    // TODO: Secure this route in production by verifying the Firebase ID token 
    // using the firebase-admin SDK and a Service Account key.
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user
      user = new User({
        email,
        displayName: (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User',
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email || 'User')}`,
        googleId
      });
      await user.save();
    } else if (!user.googleId) {
      // Link existing email/password account to Google account
      user.googleId = googleId;
      if (!user.photoURL && photoURL) user.photoURL = photoURL;
      
      // Ensure legacy accounts without a displayName are fixed before saving
      if (!user.displayName || !user.displayName.trim()) {
        user.displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User';
      }
      
      await user.save();
    }

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded; // { uid: user._id }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGithub = async (req, res) => {
  try {
    const { githubUsername, githubAccessToken } = req.body;
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.githubUsername = githubUsername;
    user.githubAccessToken = githubAccessToken;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const disconnectGithub = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.githubUsername = null;
    user.githubAccessToken = null;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, googleLogin, verifyToken, getMe, searchUsers, updateGithub, disconnectGithub };
