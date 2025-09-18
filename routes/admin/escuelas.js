const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const { Escuela, Circuito, Localidad, Mesa, Role, User, UserAccess} = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/escuelas - List escuelas with pagination

router.get('/', hasPermission('escuelas.read'), filterEntitiesByUserAccess('escuelas'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids, circuito_id, localidad_id, order_by, sort } = req.query;

    // ---------- Helper function to inject all required metrics for each school ----------
    async function injectMetrics(escuelas) {
      if (!escuelas.length) return;

      const escuelaIds = escuelas.map(e => e.id);

      // Get role IDs for fiscal general and fiscal mesa
      const [fiscalGeneralRole, fiscalMesaRole] = await Promise.all([
        Role.findOne({ where: { name: 'fiscal_general' }, attributes: ['id'], raw: true }),
        Role.findOne({ where: { name: 'fiscal_mesa' }, attributes: ['id'], raw: true })
      ]);
      
      const roleIdFG = fiscalGeneralRole?.id ?? -1;
      const roleIdFM = fiscalMesaRole?.id ?? -1;

      // Execute all queries in parallel for better performance
      const [allMesas, fiscalesGeneralesData, mesasConFiscalData] = await Promise.all([
        // 1) Get all mesas for these schools
        Mesa.findAll({
          where: { escuela_id: { [Op.in]: escuelaIds } },
          attributes: ['id', 'escuela_id', 'numero', 'mesa_testigo', 'mesa_extranjeros', 'mesa_abrio', 'status'],
          order: [['numero', 'ASC']]
        }),

        // 2) Get all fiscal general assignments for these schools
        UserAccess.findAll({
          where: { 
            escuela_id: { [Op.in]: escuelaIds },
            mesa_id: null // Fiscales generales don't have mesa_id
          },
          include: [{
            model: User,
            as: 'user',
            required: true,
            where: { role_id: roleIdFG, status: 'active' },
            attributes: ['id', 'email', 'first_name', 'last_name', 'dni', 'telefono', 'status']
          }],
          attributes: ['id', 'escuela_id', 'user_id'],
          order: [['user', 'last_name', 'ASC'], ['user', 'first_name', 'ASC']]
        }),

        // 3) Get all mesa assignments (fiscal de mesa) - JOIN with mesas to get escuela_id
        UserAccess.findAll({
          where: {
            mesa_id: { [Op.ne]: null }
          },
          include: [
            {
              model: User,
              as: 'user',
              required: true,
              where: { role_id: roleIdFM, status: 'active' },
              attributes: ['id', 'email', 'first_name', 'last_name', 'dni', 'telefono', 'status']
            },
            {
              model: Mesa,
              as: 'mesa',
              required: true,
              where: { escuela_id: { [Op.in]: escuelaIds } },
              attributes: ['id', 'numero', 'mesa_testigo', 'mesa_extranjeros', 'mesa_abrio', 'status', 'escuela_id']
            }
          ],
          attributes: ['id', 'escuela_id', 'mesa_id', 'user_id']
        })
      ]);

      // Group data by school ID for efficient processing
      const dataByEscuela = {};
      
      // Initialize data structure for each school
      escuelaIds.forEach(escuelaId => {
        dataByEscuela[escuelaId] = {
          mesas: [],
          fiscalesGenerales: [],
          mesasConFiscal: []
        };
      });

      // Group mesas by school
      allMesas.forEach(mesa => {
        if (dataByEscuela[mesa.escuela_id]) {
          dataByEscuela[mesa.escuela_id].mesas.push(mesa);
        }
      });

      // Group fiscal general assignments by school (avoid duplicates)
      const fiscalesUnicos = new Map();
      fiscalesGeneralesData.forEach(access => {
        const key = `${access.escuela_id}-${access.user_id}`;
        if (!fiscalesUnicos.has(key) && dataByEscuela[access.escuela_id]) {
          fiscalesUnicos.set(key, true);
          dataByEscuela[access.escuela_id].fiscalesGenerales.push({
            id: access.id,
            user_id: access.user_id,
            user: access.user
          });
        }
      });

      // Group mesa assignments by school (use mesa.escuela_id since UserAccess.escuela_id might be null)
      mesasConFiscalData.forEach(access => {
        const escuelaIdFromMesa = access.mesa?.escuela_id;
        if (escuelaIdFromMesa && dataByEscuela[escuelaIdFromMesa]) {
          dataByEscuela[escuelaIdFromMesa].mesasConFiscal.push({
            id: access.id,
            mesa_id: access.mesa_id,
            user_id: access.user_id,
            mesa: access.mesa,
            user: access.user
          });
        }
      });

      // Inject calculated data into each school
      for (const escuela of escuelas) {
        const escuelaId = escuela.id;
        const schoolData = dataByEscuela[escuelaId] || {
          mesas: [],
          fiscalesGenerales: [],
          mesasConFiscal: []
        };

        const { mesas, fiscalesGenerales, mesasConFiscal } = schoolData;

        // Get IDs of mesas that have fiscal assigned
        const mesaIdsConFiscal = new Set(mesasConFiscal.map(item => item.mesa_id));
        
        // Filter mesas without fiscal
        const mesasSinFiscal = mesas.filter(mesa => !mesaIdsConFiscal.has(mesa.id));

        // Generate concatenated names string for fiscales generales
        const fiscalesGeneralesNames = fiscalesGenerales
          .map(fiscal => `${fiscal.user.first_name} ${fiscal.user.last_name}`)
          .join(' || ');

        // Set all required data values with correct naming
        escuela.setDataValue('mesas', mesas);
        escuela.setDataValue('fiscalesGenerales', fiscalesGenerales);
        escuela.setDataValue('fiscalesGeneralesNames', fiscalesGeneralesNames);
        escuela.setDataValue('mesasConFiscal', mesasConFiscal);
        escuela.setDataValue('mesasSinFiscal', mesasSinFiscal);
        escuela.setDataValue('cantidadMesas', mesas.length);
        escuela.setDataValue('cantidadFiscalesGenerales', fiscalesGenerales.length);
        escuela.setDataValue('cantidadMesasCfiscal', mesasConFiscal.length);
        escuela.setDataValue('cantidadMesasSFiscal', mesasSinFiscal.length);
      }
    }
    // ------------------------------------------------------------

    // ---------- Helper function to build order clause ----------
    function buildOrderClause(order_by, sort) {
      if (!order_by || !sort || !['asc', 'desc'].includes(sort.toLowerCase())) {
        return [['nombre', 'ASC']]; // Default ordering
      }

      // Map frontend field names to database field names
      const fieldMapping = {
        'nombre': 'nombre',
        'calle': 'calle',
        'circuito': [{ model: Circuito, as: 'circuito' }, 'nombre']
        // Note: cantidadFiscalesGenerales, cantidadMesas, etc. are calculated fields 
        // that will be handled after the query in JavaScript
      };

      const dbField = fieldMapping[order_by];
      if (!dbField) {
        return [['nombre', 'ASC']]; // Fallback to default
      }

      return [Array.isArray(dbField) ? [...dbField, sort.toUpperCase()] : [dbField, sort.toUpperCase()]];
    }
    // ------------------------------------------------------------

    // ---------- Branch de IDs (multiselect) ----------
    if (ids) {
      const idArray = ids
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));

      const whereClause = { id: { [Op.in]: idArray } };
      if (req.userAccessFilter) Object.assign(whereClause, req.userAccessFilter);

      const escuelas = await Escuela.findAll({
        where: whereClause,
        include: [{
          model: Circuito,
          as: 'circuito',
          attributes: ['id', 'nombre'],
          include: [{
            model: Localidad,
            as: 'localidad',
            attributes: ['id', 'nombre']
          }]
        }],
        order: buildOrderClause(order_by, sort)
      });

      await injectMetrics(escuelas);

      // Handle sorting for calculated fields (after metrics injection)
      const calculatedFields = ['cantidadFiscalesGenerales', 'cantidadMesas', 'cantidadMesasCfiscal', 'cantidadMesasSFiscal'];
      if (order_by && calculatedFields.includes(order_by) && sort) {
        escuelas.sort((a, b) => {
          const valueA = a.getDataValue(order_by) || 0;
          const valueB = b.getDataValue(order_by) || 0;
          
          if (sort.toLowerCase() === 'asc') {
            return valueA - valueB;
          } else {
            return valueB - valueA;
          }
        });
      }

      return res.json({ success: true, data: escuelas });
    }

    // ---------- Build where ----------
    const whereClause = {};
    
    // 1. PRIMERO: Aplicar filtros de acceso del usuario (base de seguridad)
    if (req.userAccessFilter) {
      Object.assign(whereClause, req.userAccessFilter);
    }
    
    // 2. SEGUNDO: Aplicar búsqueda (se agrega, no se pisa)
    if (search) {
      const searchCondition = createSearchCondition(search, ['nombre', 'calle']);
      Object.assign(whereClause, searchCondition);
    }
    
    // 3. TERCERO: Aplicar filtros específicos (tienen prioridad sobre filtros de acceso)
    if (circuito_id) {
      whereClause.circuito_id = circuito_id;
    }
    
    if (localidad_id) {
      const circuitos = await Circuito.findAll({
        where: { localidad_id },
        attributes: ['id'],
        raw: true
      });
      const circuitoIds = circuitos.map(c => c.id);
      whereClause.circuito_id = { [Op.in]: circuitoIds };
    }

    // ---------- Count + página ----------
    const total = await Escuela.count({ where: whereClause });

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const escuelas = await Escuela.findAll({
      where: whereClause,
      include: [{
        model: Circuito,
        as: 'circuito',
        attributes: ['id', 'nombre'],
        include: [{
          model: Localidad,
          as: 'localidad',
          attributes: ['id', 'nombre']
        }]
      },
      
      ],
      order: buildOrderClause(order_by, sort),
      limit: limitNum,
      offset
    });

    // Inyectar métricas en las escuelas de esta página
    await injectMetrics(escuelas);

    // Handle sorting for calculated fields (after metrics injection)
    const calculatedFields = ['cantidadFiscalesGenerales', 'cantidadMesas', 'cantidadMesasCfiscal', 'cantidadMesasSFiscal'];
    if (order_by && calculatedFields.includes(order_by) && sort) {
      escuelas.sort((a, b) => {
        const valueA = a.getDataValue(order_by) || 0;
        const valueB = b.getDataValue(order_by) || 0;
        
        if (sort.toLowerCase() === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    }

    return res.json({
      success: true,
      data: escuelas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get escuelas error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/escuelas/:id - Get single escuela
router.get('/:id', hasPermission('escuelas.read'), async (req, res) => {
  try {
    const escuela = await Escuela.findByPk(req.params.id, {
      include: [
        {
          model: Circuito,
          as: 'circuito',
          attributes: ['id', 'nombre'],
          include: [{
            model: Localidad,
            as: 'localidad',
            attributes: ['id', 'nombre']
          }]
        },
        {
          model: Mesa,
          as: 'mesas',
          attributes: ['id', 'numero', 'status']
        }
      ]
    });

    if (!escuela) {
      return res.status(404).json({ success: false, message: 'Escuela not found' });
    }

    res.json({ success: true, data: escuela });
  } catch (error) {
    console.error('Get escuela error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/escuelas - Create new escuela
router.post('/', hasPermission('escuelas.create'), async (req, res) => {
  try {
    // Validate that circuito exists
    const circuito = await Circuito.findByPk(req.body.circuito_id);
    if (!circuito) {
      return res.status(400).json({ 
        success: false, 
        message: 'Circuito not found' 
      });
    }

    const escuela = await Escuela.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: escuela,
      message: 'Escuela created successfully'
    });
  } catch (error) {
    console.error('Create escuela error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/escuelas/:id - Update escuela
router.put('/:id', hasPermission('escuelas.update'), async (req, res) => {
  try {
    const escuela = await Escuela.findByPk(req.params.id);
    if (!escuela) {
      return res.status(404).json({ success: false, message: 'Escuela not found' });
    }

    // Validate that circuito exists if changing
    if (req.body.circuito_id && req.body.circuito_id !== escuela.circuito_id) {
      const circuito = await Circuito.findByPk(req.body.circuito_id);
      if (!circuito) {
        return res.status(400).json({ 
          success: false, 
          message: 'Circuito not found' 
        });
      }
    }

    await escuela.update(req.body);
    res.json({ success: true, data: escuela });
  } catch (error) {
    console.error('Update escuela error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/escuelas/:id - Delete escuela
router.delete('/:id', hasPermission('escuelas.delete'), async (req, res) => {
  try {
    const escuela = await Escuela.findByPk(req.params.id);
    if (!escuela) {
      return res.status(404).json({ success: false, message: 'Escuela not found' });
    }

    // Check if escuela has mesas
    const mesasCount = await Mesa.count({
      where: { escuela_id: req.params.id }
    });

    if (mesasCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete escuela with associated mesas. Please delete mesas first.' 
      });
    }

    await escuela.destroy();
    res.json({ success: true, message: 'Escuela deleted successfully' });
  } catch (error) {
    console.error('Delete escuela error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/escuelas/:id/mesas - Get mesas for a escuela
router.get('/:id/mesas', hasPermission('escuelas.read'), async (req, res) => {
  try {
    const escuela = await Escuela.findByPk(req.params.id);
    if (!escuela) {
      return res.status(404).json({ success: false, message: 'Escuela not found' });
    }

    const mesas = await Mesa.findAll({
      where: { escuela_id: req.params.id },
      order: [['numero', 'ASC']]
    });

    res.json({ success: true, data: mesas });
  } catch (error) {
    console.error('Get escuela mesas error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
