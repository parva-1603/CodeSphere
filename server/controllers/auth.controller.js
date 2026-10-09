const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { verifyToken, requireRole, requireAdmin } = require('../middleware/auth.middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_key_2026';

const generateToken = (userId, role = 'user') => {
  return jwt.sign({ uid: userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

const ensureUniqueName = async (name) => {
  let uniqueName = name;
  let counter = 1;
  const escaped = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  while (await User.findOne({ displayName: new RegExp(`^${escaped(uniqueName)}$`, 'i') })) {
    uniqueName = `${name}_${counter}`;
    counter++;
  }
  return uniqueName;
};

const generateSuggestions = async (baseName) => {
  const sanitized = baseName.trim().replace(/\s+/g, '_').toLowerCase();
  const escaped = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const candidates = [
    `${sanitized}_${Math.floor(10 + Math.random() * 90)}`,
    `${sanitized}_dev`,
    `${sanitized}_${Math.floor(100 + Math.random() * 900)}`,
    `${sanitized}.code`,
    `${sanitized}_2026`
  ];
  
  const suggestions = [];
  for (const candidate of candidates) {
    const exists = await User.findOne({ displayName: new RegExp(`^${escaped(candidate)}$`, 'i') });
    if (!exists && !suggestions.includes(candidate)) {
      suggestions.push(candidate);
    }
  }
  return suggestions;
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

    const baseName = (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User';
    const uniqueDisplayName = await ensureUniqueName(baseName);

    user = new User({
      email,
      password: hashedPassword,
      displayName: uniqueDisplayName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(uniqueDisplayName)}`
    });

    await user.save();

    const token = generateToken(user._id, user.role);
    
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

    const token = generateToken(user._id, user.role);

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
    
    let user = await User.findOne({ email });
    
    if (!user) {
      const baseName = (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User';
      const uniqueDisplayName = await ensureUniqueName(baseName);

      user = new User({
        email,
        displayName: uniqueDisplayName,
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(uniqueDisplayName)}`,
        googleId
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.photoURL && photoURL) user.photoURL = photoURL;
      
      if (!user.displayName || !user.displayName.trim()) {
        const baseName = (name && typeof name === 'string' && name.trim()) ? name.trim() : (email && email.split('@')[0]) || 'User';
        user.displayName = await ensureUniqueName(baseName);
      }
      
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    if (!query || !query.trim()) return res.json([]);
    const users = await User.find({
      $or: [
        { email: { $regex: query.trim(), $options: 'i' } },
        { displayName: { $regex: query.trim(), $options: 'i' } }
      ]
    }).select('-password').limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const trimmedName = displayName.trim();
    const escaped = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    const existing = await User.findOne({
      displayName: new RegExp(`^${escaped(trimmedName)}$`, 'i'),
      _id: { $ne: req.user.uid }
    });

    if (existing) {
      const suggestions = await generateSuggestions(trimmedName);
      return res.status(400).json({
        error: 'This display name is already taken.',
        suggestions
      });
    }

    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.displayName = trimmedName;
    if (photoURL !== undefined) {
      user.photoURL = photoURL.trim();
    }
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
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

module.exports = { 
  register, 
  login, 
  googleLogin, 
  verifyToken, 
  requireRole, 
  requireAdmin, 
  getMe, 
  searchUsers, 
  updateProfile, 
  updateGithub, 
  disconnectGithub 
};
