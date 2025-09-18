const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const { Ciudadano, Mesa, Escuela, Circuito, Localidad } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/ciudadanos - List ciudadanos with pagination
router.get('/', hasPermission('ciudadanos.read'), filterEntitiesByUserAccess('ciudadanos'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, mesa_id, mesa_numero, escuela_id, circuito_id, localidad_id, voto } = req.query;
    
    // Handle specific IDs request (for multiselect component)
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      // Build where clause for IDs with user access filter
      const whereClause = {
        id: {
          [Op.in]: idArray
        }
      };
      
      // Merge with user access filter
      if (req.userAccessFilter) {
        Object.assign(whereClause, req.userAccessFilter);
      }
      
      const ciudadanos = await Ciudadano.findAll({
        where: whereClause,
        include: [{
          model: Mesa,
          as: 'mesa',
          attributes: ['id', 'numero'],
          include: [{
            model: Escuela,
            as: 'escuela',
            attributes: ['id', 'nombre'],
            include: [{
              model: Circuito,
              as: 'circuito',
              attributes: ['id', 'nombre'],
              include: [{
                model: Localidad,
                as: 'localidad',
                attributes: ['id', 'nombre']
              }]
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
      Object.assign(whereClause, createSearchCondition(search, ['nombre', 'apellido', 'dni', 'domicilio', 'numero_orden'], {
        integerFields: ['dni', 'numero_orden'] // Especifica que DNI y numero_orden son campos numéricos
      }));
    }
    
    if (mesa_id) {
      whereClause.mesa_id = mesa_id;
    }
    
    // Filter by mesa number (convert numero to mesa_id)
    if (mesa_numero) {
      const mesa = await Mesa.findOne({
        where: { numero: mesa_numero },
        attributes: ['id']
      });
      if (mesa) {
        whereClause.mesa_id = mesa.id;
      } else {
        // If no mesa found with that number, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    }
    
    if (escuela_id) {
      // Filter by escuela through mesa
      const mesas = await Mesa.findAll({
        where: { escuela_id: escuela_id },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    if (circuito_id) {
      // Filter by circuito through escuela and mesa
      const escuelas = await Escuela.findAll({
        where: { circuito_id: circuito_id },
        attributes: ['id']
      });
      const escuelaIds = escuelas.map(e => e.id);
      const mesas = await Mesa.findAll({
        where: { escuela_id: { [Op.in]: escuelaIds } },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    if (localidad_id) {
      // Filter by localidad through circuito, escuela and mesa
      const circuitos = await Circuito.findAll({
        where: { localidad_id: localidad_id },
        attributes: ['id']
      });
      const circuitoIds = circuitos.map(c => c.id);
      const escuelas = await Escuela.findAll({
        where: { circuito_id: { [Op.in]: circuitoIds } },
        attributes: ['id']
      });
      const escuelaIds = escuelas.map(e => e.id);
      const mesas = await Mesa.findAll({
        where: { escuela_id: { [Op.in]: escuelaIds } },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    // Filter by voto status
    if (voto !== undefined && voto !== null && voto !== '') {
      if (voto === 'true' || voto === true || voto === '1') {
        whereClause.voto = true;
      } else if (voto === 'false' || voto === false || voto === '0') {
        whereClause.voto = false;
      }
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Ciudadano.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const ciudadanos = await Ciudadano.findAll({
      where: whereClause,
      include: [{
        model: Mesa,
        as: 'mesa',
        attributes: ['id', 'numero'],
        include: [{
          model: Escuela,
          as: 'escuela',
          attributes: ['id', 'nombre'],
          include: [{
            model: Circuito,
            as: 'circuito',
            attributes: ['id', 'nombre'],
            include: [{
              model: Localidad,
              as: 'localidad',
              attributes: ['id', 'nombre']
            }]
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

// GET /api/admin/ciudadanos/vote-counts - Get vote counts for badges
router.get('/vote-counts', hasPermission('ciudadanos.read'), filterEntitiesByUserAccess('ciudadanos'), async (req, res) => {
  try {
    const { mesa_id, mesa_numero, escuela_id, circuito_id, localidad_id } = req.query;
    
    // Build where clause for filters (same logic as main GET endpoint)
    const whereClause = {};
    
    if (mesa_id) {
      whereClause.mesa_id = mesa_id;
    }
    
    // Filter by mesa number (convert numero to mesa_id)
    if (mesa_numero) {
      const mesa = await Mesa.findOne({
        where: { numero: mesa_numero },
        attributes: ['id']
      });
      if (mesa) {
        whereClause.mesa_id = mesa.id;
      } else {
        // If no mesa found with that number, return zero counts
        return res.json({
          success: true,
          data: {
            total: 0,
            voted: 0,
            notVoted: 0
          }
        });
      }
    }
    
    if (escuela_id) {
      // Filter by escuela through mesa
      const mesas = await Mesa.findAll({
        where: { escuela_id: escuela_id },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    if (circuito_id) {
      // Filter by circuito through escuela and mesa
      const escuelas = await Escuela.findAll({
        where: { circuito_id: circuito_id },
        attributes: ['id']
      });
      const escuelaIds = escuelas.map(e => e.id);
      const mesas = await Mesa.findAll({
        where: { escuela_id: { [Op.in]: escuelaIds } },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    if (localidad_id) {
      // Filter by localidad through circuito, escuela and mesa
      const circuitos = await Circuito.findAll({
        where: { localidad_id: localidad_id },
        attributes: ['id']
      });
      const circuitoIds = circuitos.map(c => c.id);
      const escuelas = await Escuela.findAll({
        where: { circuito_id: { [Op.in]: circuitoIds } },
        attributes: ['id']
      });
      const escuelaIds = escuelas.map(e => e.id);
      const mesas = await Mesa.findAll({
        where: { escuela_id: { [Op.in]: escuelaIds } },
        attributes: ['id']
      });
      const mesaIds = mesas.map(m => m.id);
      whereClause.mesa_id = { [Op.in]: mesaIds };
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Ciudadano.count({ where: whereClause });
    
    // Get voted count
    const voted = await Ciudadano.count({ 
      where: { 
        ...whereClause,
        voto: true 
      } 
    });
    
    // Get not voted count
    const notVoted = await Ciudadano.count({ 
      where: { 
        ...whereClause,
        voto: false 
      } 
    });

    res.json({
      success: true,
      data: {
        total,
        voted,
        notVoted
      }
    });
  } catch (error) {
    console.error('Get vote counts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/ciudadanos/:id - Get single ciudadano
router.get('/:id', hasPermission('ciudadanos.read'), async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByPk(req.params.id, {
      include: [{
        model: Mesa,
        as: 'mesa',
        attributes: ['id', 'numero'],
        include: [{
          model: Escuela,
          as: 'escuela',
          attributes: ['id', 'nombre'],
          include: [{
            model: Circuito,
            as: 'circuito',
            attributes: ['id', 'nombre'],
            include: [{
              model: Localidad,
              as: 'localidad',
              attributes: ['id', 'nombre']
            }]
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
    // Validate that mesa exists
    const mesa = await Mesa.findByPk(req.body.mesa_id);
    if (!mesa) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa not found' 
      });
    }

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

    // Validate that mesa exists if changing
    if (req.body.mesa_id && req.body.mesa_id !== ciudadano.mesa_id) {
      const mesa = await Mesa.findByPk(req.body.mesa_id);
      if (!mesa) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mesa not found' 
        });
      }
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
        model: Mesa,
        as: 'mesa',
        attributes: ['id', 'numero'],
        include: [{
          model: Escuela,
          as: 'escuela',
          attributes: ['id', 'nombre'],
          include: [{
            model: Circuito,
            as: 'circuito',
            attributes: ['id', 'nombre'],
            include: [{
              model: Localidad,
              as: 'localidad',
              attributes: ['id', 'nombre']
            }]
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
