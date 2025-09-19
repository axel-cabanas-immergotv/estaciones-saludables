const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { Actividad, Estacion, Ciudadano, Asistente } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/actividades - List actividades with pagination
router.get('/', hasPermission('actividades.read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, estacion_id } = req.query;
    
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
      
      const actividades = await Actividad.findAll({
        where: whereClause,
        include: [
          {
            model: Estacion,
            as: 'estacion',
            attributes: ['id', 'nombre']
          },
          {
            model: Asistente,
            as: 'asistentes',
            attributes: ['id']
          }
        ],
        order: [['nombre', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: actividades
      });
    }
    
    // Build where clause for search and filters
    const whereClause = {};
    if (search) {
      Object.assign(whereClause, createSearchCondition(search, ['nombre']));
    }
    
    if (estacion_id) {
      whereClause.estacion_id = estacion_id;
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Actividad.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const actividades = await Actividad.findAll({
      where: whereClause,
      include: [
        {
          model: Estacion,
          as: 'estacion',
          attributes: ['id', 'nombre']
        },
        {
          model: Asistente,
          as: 'asistentes',
          attributes: ['id']
        }
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: actividades,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get actividades error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/actividades/:id - Get single actividad
router.get('/:id', hasPermission('actividades.read'), async (req, res) => {
  try {
    const actividad = await Actividad.findByPk(req.params.id, {
      include: [
        {
          model: Estacion,
          as: 'estacion',
          attributes: ['id', 'nombre']
        },
        {
          model: Asistente,
          as: 'asistentes',
          include: [{
            model: Ciudadano,
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'dni', 'status']
          }]
        }
      ]
    });

    if (!actividad) {
      return res.status(404).json({ success: false, message: 'Actividad not found' });
    }

    res.json({ success: true, data: actividad });
  } catch (error) {
    console.error('Get actividad error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/actividades - Create new actividad
router.post('/', hasPermission('actividades.create'), async (req, res) => {
  try {
    // Validate that estacion exists
    const estacion = await Estacion.findByPk(req.body.estacion_id);
    if (!estacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estacion not found' 
      });
    }

    const actividad = await Actividad.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: actividad,
      message: 'Actividad created successfully'
    });
  } catch (error) {
    console.error('Create actividad error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Actividad name already exists in this estacion. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/actividades/:id - Update actividad
router.put('/:id', hasPermission('actividades.update'), async (req, res) => {
  try {
    const actividad = await Actividad.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({ success: false, message: 'Actividad not found' });
    }

    // Validate that estacion exists if changing
    if (req.body.estacion_id && req.body.estacion_id !== actividad.estacion_id) {
      const estacion = await Estacion.findByPk(req.body.estacion_id);
      if (!estacion) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estacion not found' 
        });
      }
    }

    await actividad.update(req.body);
    res.json({ success: true, data: actividad });
  } catch (error) {
    console.error('Update actividad error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Actividad name already exists in this estacion. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/actividades/:id - Delete actividad
router.delete('/:id', hasPermission('actividades.delete'), async (req, res) => {
  try {
    const actividad = await Actividad.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({ success: false, message: 'Actividad not found' });
    }

    // Check if actividad has asistentes
    const asistentesCount = await Asistente.count({
      where: { actividad_id: req.params.id }
    });

    if (asistentesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete actividad with associated asistentes. Please delete asistentes first.' 
      });
    }

    await actividad.destroy();
    res.json({ success: true, message: 'Actividad deleted successfully' });
  } catch (error) {
    console.error('Delete actividad error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/actividades/:id/asistentes - Get asistentes for a actividad
router.get('/:id/asistentes', hasPermission('actividades.read'), async (req, res) => {
  try {
    const actividad = await Actividad.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({ success: false, message: 'Actividad not found' });
    }

    const asistentes = await Asistente.findAll({
      where: { actividad_id: req.params.id },
      include: [{
        model: Ciudadano,
        as: 'ciudadano',
        attributes: ['id', 'nombre', 'apellido', 'dni', 'status']
      }],
      order: [['id', 'ASC']]
    });

    res.json({ success: true, data: asistentes });
  } catch (error) {
    console.error('Get actividad ciudadanos error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
