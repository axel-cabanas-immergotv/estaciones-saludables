const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { Estacion, Actividad } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/localidades - List localidades with pagination
router.get('/', hasPermission('estaciones.read'), async (req, res) => {
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
      
      const estaciones = await Estacion.findAll({
        where: whereClause,
        include: [{
          model: Actividad,
          as: 'actividades',
          attributes: ['id', 'nombre', 'status']
        }],
        order: [['nombre', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: estaciones
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
    const total = await Estacion.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const estaciones = await Estacion.findAll({
      where: whereClause,
      include: [{
        model: Actividad,
        as: 'actividades',
        attributes: ['id', 'nombre', 'status']
      }],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: estaciones,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get estaciones error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/localidades/:id - Get single localidad
router.get('/:id', hasPermission('estaciones.read'), async (req, res) => {
  try {
    const estacion = await Estacion.findByPk(req.params.id, {
      include: [{
        model: Actividad,
        as: 'actividades',
        attributes: ['id', 'nombre', 'status']
      }]
    });

    if (!estacion) {
      return res.status(404).json({ success: false, message: 'Estacion not found' });
    }

    res.json({ success: true, data: estacion });
  } catch (error) {
    console.error('Get estacion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/localidades - Create new localidad
router.post('/', hasPermission('estaciones.create'), async (req, res) => {
  try {
    const estacion = await Estacion.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: estacion,
      message: 'Estacion created successfully'
    });
  } catch (error) {
    console.error('Create estacion error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Estacion name already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/localidades/:id - Update localidad
router.put('/:id', hasPermission('estaciones.update'), async (req, res) => {
  try {
    const estacion = await Estacion.findByPk(req.params.id);
    if (!estacion) {
      return res.status(404).json({ success: false, message: 'Estacion not found' });
    }

    await estacion.update(req.body);
    res.json({ success: true, data: estacion });
  } catch (error) {
    console.error('Update estacion error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Estacion name already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/localidades/:id - Delete localidad
router.delete('/:id', hasPermission('estaciones.delete'), async (req, res) => {
  try {
    const estacion = await Estacion.findByPk(req.params.id);
    if (!estacion) {
      return res.status(404).json({ success: false, message: 'Estacion not found' });
    }

    // Check if estacion has actividades
    const actividadesCount = await Actividad.count({
      where: { estacion_id: req.params.id }
    });

    if (actividadesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete estacion with associated actividades. Please delete actividades first.' 
      });
    }

    await estacion.destroy();
    res.json({ success: true, message: 'Estacion deleted successfully' });
  } catch (error) {
    console.error('Delete estacion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/localidades/:id/actividades - Get actividades for a localidad
router.get('/:id/actividades', hasPermission('estaciones.read'), async (req, res) => {
  try {
    const estacion = await Estacion.findByPk(req.params.id);
    if (!estacion) {
      return res.status(404).json({ success: false, message: 'Estacion not found' });
    }

    const actividades = await Actividad.findAll({
      where: { estacion_id: req.params.id },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: actividades });
  } catch (error) {
    console.error('Get estacion actividades error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
