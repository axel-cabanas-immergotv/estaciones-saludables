const express = require('express');
const { Op } = require('sequelize');
const { Role, Permission } = require('../../models');
const { hasPermission } = require('../../middleware/auth');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/roles - List all roles with pagination
router.get('/', hasPermission('roles.read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      Object.assign(where, createSearchCondition(search, ['name', 'display_name']));
    }

    const roles = await Role.findAndCountAll({
      where,
      include: ['permissions'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: roles.rows,
      pagination: {
        total: roles.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(roles.count / limit)
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/roles/:id - Get single role
router.get('/:id', hasPermission('roles.read'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: ['permissions']
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/roles - Create new role
router.post('/', hasPermission('roles.create'), async (req, res) => {
  try {
    const { permissions, ...roleData } = req.body;
    
    // Ensure status has a valid value
    if (!roleData.status || roleData.status === '') {
      roleData.status = 'active'; // Default to active if not provided or empty
    }
    
    const role = await Role.create(roleData);
    
    // Associate permissions if provided
    if (permissions && Array.isArray(permissions)) {
      await role.setPermissions(permissions);
    }
    
    // Fetch the created role with permissions
    const createdRole = await Role.findByPk(role.id, {
      include: ['permissions']
    });

    res.status(201).json({ success: true, data: createdRole });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/roles/:id - Update role
router.put('/:id', hasPermission('roles.update'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const { permissions, ...roleData } = req.body;
    
    // Ensure status has a valid value
    if (!roleData.status || roleData.status === '') {
      roleData.status = 'active'; // Default to active if not provided or empty
    }
    
    await role.update(roleData);
    
    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      await role.setPermissions(permissions);
    }
    
    // Fetch updated role with permissions
    const updatedRole = await Role.findByPk(role.id, {
      include: ['permissions']
    });

    res.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/roles/:id - Delete role
router.delete('/:id', hasPermission('roles.delete'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Check if role is being used by users
    const userCount = await role.countUsers();
    if (userCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete role. It is currently assigned to ${userCount} user(s).` 
      });
    }

    await role.destroy();
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 