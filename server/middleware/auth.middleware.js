const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_key_2026';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded; // { uid, role }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      req.dbUser = user;

      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          error: `Access denied. Requires one of [${roles.join(', ')}] permissions.` 
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

const requireAdmin = requireRole('admin');

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin
};
