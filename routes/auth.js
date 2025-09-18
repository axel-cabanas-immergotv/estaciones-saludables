const express = require('express');
const { User, Role } = require('../models');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, telefono, password } = req.body;

    // Validate that we have either email or telefono (not both, not neither)
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña es requerida'
      });
    }

    if (!email && !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Email o teléfono es requerido'
      });
    }

    // Build the where condition based on what was provided
    const whereCondition = {};
    if (email) {
      whereCondition.email = email;
    }
    if (telefono) {
      whereCondition.telefono = telefono;
    }

    // Find user with role
    const user = await User.findOne({
      where: whereCondition,
      include: [{
        model: Role,
        as: 'role',
        include: ['permissions']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Check authentication status
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          include: ['permissions']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email', 'telefono', 'dni'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'display_name']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        telefono: user.telefono,
        dni: user.dni,
        created_by: user.created_by,
        creator: user.creator,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register (admin only for now)
router.post('/register', verifyToken, async (req, res) => {
  try {
    // Check if user has permission to create users
    const hasPermission = await req.user.role.hasPermission('users.create');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const { email, password, first_name, last_name, role_id } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role_id: role_id || 2 // Default to editor role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    // Verify current password
    const isValidPassword = await req.user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await req.user.update({ password: new_password });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 