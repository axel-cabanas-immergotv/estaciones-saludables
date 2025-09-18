const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role_id: user.role_id 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user with role information
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'role',
        include: ['permissions']
      }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Check if user has specific permission
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required.' 
        });
      }

      const userRole = req.user.role;
      if (!userRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'No role assigned.' 
        });
      }

      const hasPermission = await userRole.hasPermission(permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions.' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions.' 
      });
    }
  };
};

// Check if user can edit own content
const canEditOwn = (entity) => {
  return async (req, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user.id;
      
      // Admin can edit anything
      if (req.user.role.name === 'admin') {
        return next();
      }

      // Check if user owns the content
      const { [entity]: Model } = require('../models');
      const item = await Model.findByPk(itemId);
      
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          message: 'Item not found.' 
        });
      }

      if (item.author_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only edit your own content.' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking ownership.' 
      });
    }
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        include: [{
          model: Role,
          as: 'role',
          include: ['permissions']
        }]
      });

      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hasPermission,
  canEditOwn,
  optionalAuth,
  JWT_SECRET
}; 