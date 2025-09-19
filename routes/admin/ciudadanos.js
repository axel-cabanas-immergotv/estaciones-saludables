const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { Ciudadano, Asistente, Actividad, Estacion } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/ciudadanos - List ciudadanos with pagination
router.get('/', hasPermission('ciudadanos.read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, estacion_id, actividad_id } = req.query;
    
    // Handle specific IDs request (for multiselect component)
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      const whereClause = {
        id: {
          [Op.in]: idArray
        }
      };
      
      const ciudadanos = await Ciudadano.findAll({
        where: whereClause,
        include: [{
          model: Asistente,
          as: 'asistentes',
          attributes: ['id'],
          include: [{
            model: Actividad,
            as: 'actividad',
            attributes: ['id', 'nombre'],
            include: [{
              model: Estacion,
              as: 'estacion',
              attributes: ['id', 'nombre']
            }]
          }]
        }],
        order: [['apellido', 'ASC'], ['nombre', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: ciudadanos
      });
    }
    
    // Build where clause for search and filters
    const whereClause = {};
    if (search) {
      Object.assign(whereClause, createSearchCondition(search, ['nombre', 'apellido', 'dni', 'domicilio'], {
        integerFields: ['dni'] // DNI es campo numérico
      }));
    }
    
    // Filter by actividad_id (citizens who participate in specific activity)
    let ciudadanoIds = null;
    if (actividad_id) {
      const asistentes = await Asistente.findAll({
        where: { actividad_id: actividad_id },
        attributes: ['ciudadano_id']
      });
      ciudadanoIds = asistentes.map(a => a.ciudadano_id);
      if (ciudadanoIds.length === 0) {
        // No citizens found for this activity
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
      whereClause.id = { [Op.in]: ciudadanoIds };
    }
    
    // Filter by estacion_id (citizens who participate in activities at specific station)
    if (estacion_id && !actividad_id) {
      const actividades = await Actividad.findAll({
        where: { estacion_id: estacion_id },
        attributes: ['id']
      });
      const actividadIds = actividades.map(a => a.id);
      
      if (actividadIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
      
      const asistentes = await Asistente.findAll({
        where: { actividad_id: { [Op.in]: actividadIds } },
        attributes: ['ciudadano_id']
      });
      ciudadanoIds = [...new Set(asistentes.map(a => a.ciudadano_id))]; // Remove duplicates
      
      if (ciudadanoIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
      whereClause.id = { [Op.in]: ciudadanoIds };
    }
    
    // Get total count
    const total = await Ciudadano.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const ciudadanos = await Ciudadano.findAll({
      where: whereClause,
      include: [{
        model: Asistente,
        as: 'asistentes',
        attributes: ['id'],
        include: [{
          model: Actividad,
          as: 'actividad',
          attributes: ['id', 'nombre'],
          include: [{
            model: Estacion,
            as: 'estacion',
            attributes: ['id', 'nombre']
          }]
        }]
      }],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: ciudadanos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get ciudadanos error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// GET /api/admin/ciudadanos/:id - Get single ciudadano
router.get('/:id', hasPermission('ciudadanos.read'), async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByPk(req.params.id, {
      include: [{
        model: Asistente,
        as: 'asistentes',
        include: [{
          model: Actividad,
          as: 'actividad',
          attributes: ['id', 'nombre', 'horario', 'profesor'],
          include: [{
            model: Estacion,
            as: 'estacion',
            attributes: ['id', 'nombre', 'direccion']
          }]
        }]
      }]
    });

    if (!ciudadano) {
      return res.status(404).json({ success: false, message: 'Ciudadano not found' });
    }

    res.json({ success: true, data: ciudadano });
  } catch (error) {
    console.error('Get ciudadano error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/ciudadanos - Create new ciudadano
router.post('/', hasPermission('ciudadanos.create'), async (req, res) => {
  try {
    // Check if DNI already exists
    const existingCiudadano = await Ciudadano.findOne({
      where: { dni: req.body.dni }
    });

    if (existingCiudadano) {
      return res.status(400).json({ 
        success: false, 
        message: 'DNI already exists. Please use a different DNI.' 
      });
    }

    const ciudadano = await Ciudadano.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: ciudadano,
      message: 'Ciudadano created successfully'
    });
  } catch (error) {
    console.error('Create ciudadano error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'DNI already exists. Please use a different DNI.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/ciudadanos/:id - Update ciudadano
router.put('/:id', hasPermission('ciudadanos.update'), async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByPk(req.params.id);
    if (!ciudadano) {
      return res.status(404).json({ success: false, message: 'Ciudadano not found' });
    }

    // Check if DNI already exists (if changing DNI)
    if (req.body.dni && req.body.dni !== ciudadano.dni) {
      const existingCiudadano = await Ciudadano.findOne({
        where: { 
          dni: req.body.dni,
          id: { [Op.ne]: req.params.id }
        }
      });

      if (existingCiudadano) {
        return res.status(400).json({ 
          success: false, 
          message: 'DNI already exists. Please use a different DNI.' 
        });
      }
    }

    await ciudadano.update(req.body);
    res.json({ success: true, data: ciudadano });
  } catch (error) {
    console.error('Update ciudadano error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'DNI already exists. Please use a different DNI.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/ciudadanos/:id - Delete ciudadano
router.delete('/:id', hasPermission('ciudadanos.delete'), async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByPk(req.params.id);
    if (!ciudadano) {
      return res.status(404).json({ success: false, message: 'Ciudadano not found' });
    }

    // Check if ciudadano has asistencias
    const asistenciasCount = await Asistente.count({
      where: { ciudadano_id: req.params.id }
    });

    if (asistenciasCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete ciudadano with associated asistencias. Please delete asistencias first.' 
      });
    }

    await ciudadano.destroy();
    res.json({ success: true, message: 'Ciudadano deleted successfully' });
  } catch (error) {
    console.error('Delete ciudadano error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/ciudadanos/search/dni/:dni - Search ciudadano by DNI
router.get('/search/dni/:dni', hasPermission('ciudadanos.read'), async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findOne({
      where: { dni: req.params.dni },
      include: [{
        model: Asistente,
        as: 'asistentes',
        include: [{
          model: Actividad,
          as: 'actividad',
          attributes: ['id', 'nombre', 'horario', 'profesor'],
          include: [{
            model: Estacion,
            as: 'estacion',
            attributes: ['id', 'nombre', 'direccion']
          }]
        }]
      }]
    });

    if (!ciudadano) {
      return res.status(404).json({ success: false, message: 'Ciudadano not found' });
    }

    res.json({ success: true, data: ciudadano });
  } catch (error) {
    console.error('Search ciudadano by DNI error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
