const express = require('express');
const { Op } = require('sequelize');
const { Seccion } = require('../../models');
const { hasPermission } = require('../../middleware/auth');
const { affiliateMiddleware, requireAffiliate } = require('../../middleware/affiliate');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');

const router = express.Router();

// GET /api/admin/seccion - List all seccion with pagination
router.get('/', affiliateMiddleware, requireAffiliate,filterEntitiesByUserAccess('secciones'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(where, req.userAccessFilter);
    }

    const seccion = await Seccion.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: seccion.rows,
      pagination: {
        total: seccion.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(seccion.count / limit)
      }
    });
  } catch (error) {
    console.error('Get seccion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/seccion/:id - Get single seccion
router.get('/:id', affiliateMiddleware, requireAffiliate, async (req, res) => {
  try {
    const seccion = await Seccion.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!seccion) {
      return res.status(404).json({ success: false, message: 'Seccion not found' });
    }

    res.json({ success: true, data: seccion });
  } catch (error) {
    console.error('Get seccion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/seccion - Create new seccion
router.post('/', hasPermission('seccion.create'), async (req, res) => {
  try {
    const seccion = await Seccion.create(req.body);
    res.status(201).json({ success: true, data: seccion });
  } catch (error) {
    console.error('Create seccion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/seccion/:id - Update seccion
router.put('/:id', hasPermission('seccion.update'), async (req, res) => {
  try {
    const seccion = await Seccion.findByPk(req.params.id);
    if (!seccion) {
      return res.status(404).json({ success: false, message: 'Seccion not found' });
    }

    await seccion.update(req.body);
    res.json({ success: true, data: seccion });
  } catch (error) {
    console.error('Update seccion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

    // DELETE /api/admin/seccion/:id - Delete seccion
router.delete('/:id', hasPermission('seccion.delete'), async (req, res) => {
  try {
    const seccion = await Seccion.findByPk(req.params.id);
    if (!seccion) {
      return res.status(404).json({ success: false, message: 'Seccion not found' });
    }

    await seccion.destroy();
    res.json({ success: true, message: 'Seccion deleted successfully' });
  } catch (error) {
    console.error('Delete seccion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 