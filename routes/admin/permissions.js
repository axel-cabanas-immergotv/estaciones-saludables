const express = require('express');
const { Op } = require('sequelize');
const { Permission } = require('../../models');
const { hasPermission } = require('../../middleware/auth');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/permissions - List all permissions with pagination
router.get('/', hasPermission('permissions.read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, entity, action } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      Object.assign(where, createSearchCondition(search, ['name', 'entity', 'action']));
    }

    const permissions = await Permission.findAndCountAll({
      where,
      order: [['entity', 'ASC'], ['action', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: permissions.rows,
      pagination: {
        total: permissions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(permissions.count / limit)
      }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/permissions/:id - Get single permission
router.get('/:id', hasPermission('permissions.read'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);

    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found' });
    }

    res.json({ success: true, data: permission });
  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/permissions - Create new permission
router.post('/', hasPermission('permissions.create'), async (req, res) => {
  try {
    const permission = await Permission.create(req.body);
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/permissions/:id - Update permission
router.put('/:id', hasPermission('permissions.update'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found' });
    }

    await permission.update(req.body);
    res.json({ success: true, data: permission });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/permissions/:id - Delete permission
router.delete('/:id', hasPermission('permissions.delete'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found' });
    }

    // Check if permission is being used by roles
    const roleCount = await permission.countRoles();
    if (roleCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete permission. It is currently assigned to ${roleCount} role(s).` 
      });
    }

    await permission.destroy();
    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 