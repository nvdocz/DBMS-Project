const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nvdrive_super_secret_key_123';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const bearer = token.split(' ')[1]; // "Bearer token"
    const decoded = jwt.verify(bearer, JWT_SECRET);
    req.user = decoded; // { id, role, name }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
};

const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  hasRole,
  JWT_SECRET
};
