const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const { Circuito, Localidad, Escuela } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/circuitos - List circuitos with pagination
router.get('/', hasPermission('circuitos.read'), filterEntitiesByUserAccess('circuitos'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, localidad_id } = req.query;
    
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
      
      const circuitos = await Circuito.findAll({
        where: whereClause,
        include: [{
          model: Localidad,
          as: 'localidad',
          attributes: ['id', 'nombre']
        }],
        order: [['nombre', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: circuitos
      });
    }
    
    // Build where clause for search and filters
    const whereClause = {};
    if (search) {
      Object.assign(whereClause, createSearchCondition(search, ['nombre']));
    }
    
    if (localidad_id) {
      whereClause.localidad_id = localidad_id;
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Circuito.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const circuitos = await Circuito.findAll({
      where: whereClause,
      include: [{
        model: Localidad,
        as: 'localidad',
        attributes: ['id', 'nombre']
      }],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: circuitos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get circuitos error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/circuitos/:id - Get single circuito
router.get('/:id', hasPermission('circuitos.read'), async (req, res) => {
  try {
    const circuito = await Circuito.findByPk(req.params.id, {
      include: [
        {
          model: Localidad,
          as: 'localidad',
          attributes: ['id', 'nombre']
        },
        {
          model: Escuela,
          as: 'escuelas',
          attributes: ['id', 'nombre', 'status']
        }
      ]
    });

    if (!circuito) {
      return res.status(404).json({ success: false, message: 'Circuito not found' });
    }

    res.json({ success: true, data: circuito });
  } catch (error) {
    console.error('Get circuito error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/circuitos - Create new circuito
router.post('/', hasPermission('circuitos.create'), async (req, res) => {
  try {
    // Validate that localidad exists
    const localidad = await Localidad.findByPk(req.body.localidad_id);
    if (!localidad) {
      return res.status(400).json({ 
        success: false, 
        message: 'Localidad not found' 
      });
    }

    const circuito = await Circuito.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: circuito,
      message: 'Circuito created successfully'
    });
  } catch (error) {
    console.error('Create circuito error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Circuito name already exists in this localidad. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/circuitos/:id - Update circuito
router.put('/:id', hasPermission('circuitos.update'), async (req, res) => {
  try {
    const circuito = await Circuito.findByPk(req.params.id);
    if (!circuito) {
      return res.status(404).json({ success: false, message: 'Circuito not found' });
    }

    // Validate that localidad exists if changing
    if (req.body.localidad_id && req.body.localidad_id !== circuito.localidad_id) {
      const localidad = await Localidad.findByPk(req.body.localidad_id);
      if (!localidad) {
        return res.status(400).json({ 
          success: false, 
          message: 'Localidad not found' 
        });
      }
    }

    await circuito.update(req.body);
    res.json({ success: true, data: circuito });
  } catch (error) {
    console.error('Update circuito error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Circuito name already exists in this localidad. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/circuitos/:id - Delete circuito
router.delete('/:id', hasPermission('circuitos.delete'), async (req, res) => {
  try {
    const circuito = await Circuito.findByPk(req.params.id);
    if (!circuito) {
      return res.status(404).json({ success: false, message: 'Circuito not found' });
    }

    // Check if circuito has escuelas
    const escuelasCount = await Escuela.count({
      where: { circuito_id: req.params.id }
    });

    if (escuelasCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete circuito with associated escuelas. Please delete escuelas first.' 
      });
    }

    await circuito.destroy();
    res.json({ success: true, message: 'Circuito deleted successfully' });
  } catch (error) {
    console.error('Delete circuito error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/circuitos/:id/escuelas - Get escuelas for a circuito
router.get('/:id/escuelas', hasPermission('circuitos.read'), async (req, res) => {
  try {
    const circuito = await Circuito.findByPk(req.params.id);
    if (!circuito) {
      return res.status(404).json({ success: false, message: 'Circuito not found' });
    }

    const escuelas = await Escuela.findAll({
      where: { circuito_id: req.params.id },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: escuelas });
  } catch (error) {
    console.error('Get circuito escuelas error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
