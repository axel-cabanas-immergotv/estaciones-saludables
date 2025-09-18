const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const { Mesa, Escuela, Circuito, Localidad, Ciudadano, User, UserAccess, Role } = require('../../models');


const router = express.Router();

// GET /api/admin/mesas - List mesas with pagination
router.get('/', hasPermission('mesas.read'), filterEntitiesByUserAccess('mesas'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, escuela_id, circuito_id, localidad_id } = req.query;
    
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
      
      const mesas = await Mesa.findAll({
        where: whereClause,
        include: [
          {
            model: Escuela,
            as: 'escuela',
            attributes: ['id','nombre'],
            include: [{
              model: Circuito, as: 'circuito', attributes: ['id','nombre'],
              include: [{ model: Localidad, as: 'localidad', attributes: ['id','nombre'] }]
            }]
          },
          {
            model: UserAccess,
            as: 'user_assignments',
            required: false,          // LEFT JOIN respecto a Mesa
            separate: true,           // <— hace una query aparte para este include
            include: [{
              model: User,
              as: 'user',
              required: true,         // descarta assignments sin user válido
              attributes: ['id','first_name','last_name','dni','telefono','email'],
              include: [{
                model: Role,
                as: 'role',
                required: true,       // obliga al rol
                where: { name: 'fiscal_mesa' },
                attributes: []        // <— NO selecciones columnas de Role (clave)
              }]
            }]
          }
        ],
        order: [['numero', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: mesas
      });
    }
    
    // Build where clause for search and filters
    const whereClause = {};
    if (search) {
      // Custom search for mesa numero (INTEGER column)
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        // If search is a valid number, search for exact match
        whereClause.numero = searchNum;
      } else {
        // If search is not a number, search for partial match in numero as string
        whereClause.numero = {
          [Op.like]: `%${search}%`
        };
      }
    }
    
    if (escuela_id) {
      whereClause.escuela_id = escuela_id;
    }
    
    if (circuito_id) {
      // Filter by circuito through escuela
      const escuelas = await Escuela.findAll({
        where: { circuito_id: circuito_id },
        attributes: ['id']
      });
      const escuelaIds = escuelas.map(e => e.id);
      whereClause.escuela_id = { [Op.in]: escuelaIds };
    }
    
    if (localidad_id) {
      // Filter by localidad through circuito and escuela
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
      whereClause.escuela_id = { [Op.in]: escuelaIds };
    }
    
    // Merge with user access filter
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // Get total count
    const total = await Mesa.count({ where: whereClause });
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const mesas = await Mesa.findAll({
      where: whereClause,
      include: [
        {
          model: Escuela,
          as: 'escuela',
          attributes: ['id','nombre'],
          include: [{
            model: Circuito, as: 'circuito', attributes: ['id','nombre'],
            include: [{ model: Localidad, as: 'localidad', attributes: ['id','nombre'] }]
          }]
        },
        {
          model: UserAccess,
          as: 'user_assignments',
          required: false,          // LEFT JOIN respecto a Mesa
          separate: true,           // <— hace una query aparte para este include
          include: [{
            model: User,
            as: 'user',
            required: true,         // descarta assignments sin user válido
            attributes: ['id','first_name','last_name','dni','telefono','email'],
            include: [{
              model: Role,
              as: 'role',
              required: true,       // obliga al rol
              where: { name: 'fiscal_mesa' },
              attributes: []        // <— NO selecciones columnas de Role (clave)
            }]
          }]
        }
      ],
      order: [['numero', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: mesas,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get mesas error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/mesas/:id - Get single mesa
router.get('/:id', hasPermission('mesas.read'), async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id, {
      include: [
        {
          model: Escuela,
          as: 'escuela',
          attributes: ['id','nombre'],
          include: [{
            model: Circuito, as: 'circuito', attributes: ['id','nombre'],
            include: [{ model: Localidad, as: 'localidad', attributes: ['id','nombre'] }]
          }]
        },
        {
          model: UserAccess,
          as: 'user_assignments',
          required: false,          // LEFT JOIN respecto a Mesa
          separate: true,           // <— hace una query aparte para este include
          include: [{
            model: User,
            as: 'user',
            required: true,         // descarta assignments sin user válido
            attributes: ['id','first_name','last_name','dni','telefono','email'],
            include: [{
              model: Role,
              as: 'role',
              required: true,       // obliga al rol
              where: { name: 'fiscal_mesa' },
              attributes: []        // <— NO selecciones columnas de Role (clave)
            }]
          }]
        },
        {
          model: Ciudadano,
          as: 'ciudadanos',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'status']
        }
      ]
    });

    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa not found' });
    }

    res.json({ success: true, data: mesa });
  } catch (error) {
    console.error('Get mesa error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/mesas - Create new mesa
router.post('/', hasPermission('mesas.create'), async (req, res) => {
  try {
    // Validate that escuela exists
    const escuela = await Escuela.findByPk(req.body.escuela_id);
    if (!escuela) {
      return res.status(400).json({ 
        success: false, 
        message: 'Escuela not found' 
      });
    }

    // Check if mesa number already exists in this escuela
    const existingMesa = await Mesa.findOne({
      where: {
        escuela_id: req.body.escuela_id,
        numero: req.body.numero
      }
    });

    if (existingMesa) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa number already exists in this escuela' 
      });
    }

    const mesa = await Mesa.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: mesa,
      message: 'Mesa created successfully'
    });
  } catch (error) {
    console.error('Create mesa error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/mesas/:id - Update mesa
router.put('/:id', hasPermission('mesas.update'), async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa not found' });
    }

    // Validate that escuela exists if changing
    if (req.body.escuela_id && req.body.escuela_id !== mesa.escuela_id) {
      const escuela = await Escuela.findByPk(req.body.escuela_id);
      if (!escuela) {
        return res.status(400).json({ 
          success: false, 
          message: 'Escuela not found' 
        });
      }
    }

    // Check if mesa number already exists in the escuela (if changing escuela or numero)
    if ((req.body.escuela_id && req.body.escuela_id !== mesa.escuela_id) || 
        (req.body.numero && req.body.numero !== mesa.numero)) {
      const existingMesa = await Mesa.findOne({
        where: {
          escuela_id: req.body.escuela_id || mesa.escuela_id,
          numero: req.body.numero || mesa.numero,
          id: { [Op.ne]: req.params.id }
        }
      });

      if (existingMesa) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mesa number already exists in this escuela' 
        });
      }
    }

    await mesa.update(req.body);
    res.json({ success: true, data: mesa });
  } catch (error) {
    console.error('Update mesa error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/mesas/:id - Delete mesa
router.delete('/:id', hasPermission('mesas.delete'), async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa not found' });
    }

    // Check if mesa has ciudadanos
    const ciudadanosCount = await Ciudadano.count({
      where: { mesa_id: req.params.id }
    });

    if (ciudadanosCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete mesa with associated ciudadanos. Please delete ciudadanos first.' 
      });
    }

    await mesa.destroy();
    res.json({ success: true, message: 'Mesa deleted successfully' });
  } catch (error) {
    console.error('Delete mesa error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/mesas/:id/ciudadanos - Get ciudadanos for a mesa
router.get('/:id/ciudadanos', hasPermission('mesas.read'), async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa not found' });
    }

    const ciudadanos = await Ciudadano.findAll({
      where: { mesa_id: req.params.id },
      order: [['numero_orden', 'ASC'], ['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({ success: true, data: ciudadanos });
  } catch (error) {
    console.error('Get mesa ciudadanos error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
