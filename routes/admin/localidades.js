const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const { Localidad, Circuito } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/localidades - List localidades with pagination
router.get('/', hasPermission('localidades.read'), filterEntitiesByUserAccess('localidades'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids } = req.query;
    
    // Handle specific IDs request (for multiselect component)
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      // Apply user access filter to IDs request
      const whereClause = {
        id: {
          [Op.in]: idArray
        }
      };
      
      // Merge with user access filter
      if (req.userAccessFilter) {
        Object.assign(whereClause, req.userAccessFilter);
      }
      
      const localidades = await Localidad.findAll({
        where: whereClause,
        order: [['nombre', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: localidades
      });
    }
    
    // Build where clause for search
    const whereClause = {};
    if (search) {
      Object.assign(whereClause, createSearchCondition(search, ['nombre']));
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Localidad.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const localidades = await Localidad.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: localidades,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get localidades error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/localidades/:id - Get single localidad
router.get('/:id', hasPermission('localidades.read'), async (req, res) => {
  try {
    const localidad = await Localidad.findByPk(req.params.id, {
      include: [{
        model: Circuito,
        as: 'circuitos',
        attributes: ['id', 'nombre', 'status']
      }]
    });

    if (!localidad) {
      return res.status(404).json({ success: false, message: 'Localidad not found' });
    }

    res.json({ success: true, data: localidad });
  } catch (error) {
    console.error('Get localidad error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/localidades - Create new localidad
router.post('/', hasPermission('localidades.create'), async (req, res) => {
  try {
    const localidad = await Localidad.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: localidad,
      message: 'Localidad created successfully'
    });
  } catch (error) {
    console.error('Create localidad error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Localidad name already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/localidades/:id - Update localidad
router.put('/:id', hasPermission('localidades.update'), async (req, res) => {
  try {
    const localidad = await Localidad.findByPk(req.params.id);
    if (!localidad) {
      return res.status(404).json({ success: false, message: 'Localidad not found' });
    }

    await localidad.update(req.body);
    res.json({ success: true, data: localidad });
  } catch (error) {
    console.error('Update localidad error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Localidad name already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/localidades/:id - Delete localidad
router.delete('/:id', hasPermission('localidades.delete'), async (req, res) => {
  try {
    const localidad = await Localidad.findByPk(req.params.id);
    if (!localidad) {
      return res.status(404).json({ success: false, message: 'Localidad not found' });
    }

    // Check if localidad has circuitos
    const circuitosCount = await Circuito.count({
      where: { localidad_id: req.params.id }
    });

    if (circuitosCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete localidad with associated circuitos. Please delete circuitos first.' 
      });
    }

    await localidad.destroy();
    res.json({ success: true, message: 'Localidad deleted successfully' });
  } catch (error) {
    console.error('Delete localidad error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/localidades/:id/circuitos - Get circuitos for a localidad
router.get('/:id/circuitos', hasPermission('localidades.read'), async (req, res) => {
  try {
    const localidad = await Localidad.findByPk(req.params.id);
    if (!localidad) {
      return res.status(404).json({ success: false, message: 'Localidad not found' });
    }

    const circuitos = await Circuito.findAll({
      where: { localidad_id: req.params.id },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: circuitos });
  } catch (error) {
    console.error('Get localidad circuitos error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
