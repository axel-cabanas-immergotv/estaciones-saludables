const express = require('express');
const { Op } = require('sequelize');
const { User, Role, Affiliate, UserAffiliate, UserAccess, Localidad, Circuito, Escuela, Mesa } = require('../../models');
const { hasPermission } = require('../../middleware/auth');
const { affiliateMiddleware, requireAffiliate } = require('../../middleware/affiliate');
const { validateRoleHierarchy } = require('../../middleware/roleHierarchy');
const { validateUserData } = require('../../middleware/userValidation');
const { createSearchCondition } = require('../../utils/searchUtils');
const { filterEntitiesByUserAccess } = require('../../middleware/entityAccess');
const router = express.Router();



router.get('/available-roles', hasPermission('users.create'), async (req, res) => {
  try {
    const currentUserRole = req.user.role;
    

    if (!currentUserRole) {
      return res.status(403).json({
        success: false,
        message: 'No role assigned to current user'
      });
    }

    // Get all roles
    const allRoles = await Role.findAll({
      where: { status: 'active' },
      order: [['display_name', 'ASC']]
    });

    // Filter roles based on hierarchy
    let availableRoles = [];
    
    if (currentUserRole.name === 'admin') {
      // Admin can create any role
      availableRoles = allRoles;
    } else {
      // Get available roles from hierarchy
      const { getAvailableRolesForCreation } = require('../../middleware/roleHierarchy');
      const allowedRoleNames = getAvailableRolesForCreation(currentUserRole.name);
      
      availableRoles = allRoles.filter(role => allowedRoleNames.includes(role.name));
    }
    

    res.json({
      success: true,
      data: availableRoles
    });
  } catch (error) {
    console.error('Get available roles error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/me/access - Get current user's access levels
router.get('/me/access', hasPermission('users.read'), async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // If user is admin return everything
    if (req.user.role.name === 'admin') {
      const userAccess = await UserAccess.findAll({
        where: { status: 'active' },
        include: [
          { model: Localidad, as: 'localidad', attributes: ['id', 'nombre'] },
          { model: Circuito, as: 'circuito', attributes: ['id', 'nombre', 'localidad_id'] },
          { model: Escuela, as: 'escuela', attributes: ['id', 'nombre', 'circuito_id'] },
          { model: Mesa, as: 'mesa', attributes: ['id', 'numero', 'escuela_id'] }
        ]
      });
      return res.json({ success: true, data: userAccess });
    }

    // Get current user's access levels
    const userAccess = await UserAccess.findAll({
      where: { 
        user_id: currentUserId,
        status: 'active'
      },
      include: [
        { model: Localidad, as: 'localidad', attributes: ['id', 'nombre'] },
        { model: Circuito, as: 'circuito', attributes: ['id', 'nombre', 'localidad_id'] },
        { model: Escuela, as: 'escuela', attributes: ['id', 'nombre', 'circuito_id'] },
        { model: Mesa, as: 'mesa', attributes: ['id', 'numero', 'escuela_id'] }
      ]
    });

    

    // Transform data to match frontend expectations
    const transformedAccess = userAccess.map(access => {
      const accessData = {
        id: access.id,
        status: access.status
      };

      if (access.localidad) {
        accessData.localidad_id = access.localidad.id;
        accessData.localidad_name = access.localidad.nombre;
      }
      if (access.circuito) {
        accessData.circuito_id = access.circuito.id;
        accessData.circuito_name = access.circuito.nombre;
        accessData.localidad_id = access.circuito.localidad_id;
      }
      if (access.escuela) {
        accessData.escuela_id = access.escuela.id;
        accessData.escuela_name = access.escuela.nombre;
        accessData.circuito_id = access.escuela.circuito_id;
      }
      if (access.mesa) {
        accessData.mesa_id = access.mesa.id;
        accessData.mesa_numero = access.mesa.numero;
        accessData.escuela_id = access.mesa.escuela_id;
      }

      return accessData;
    });

    res.json({
      success: true,
      data: transformedAccess
    });
  } catch (error) {
    console.error('Get current user access error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/:id/access - Get specific user's access levels
router.get('/:id/access', hasPermission('users.read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's access levels
    const userAccess = await UserAccess.findAll({
      where: { 
        user_id: userId,
        status: 'active'
      },
      include: [
        { model: Localidad, as: 'localidad', attributes: ['id', 'nombre'] },
        { model: Circuito, as: 'circuito', attributes: ['id', 'nombre', 'localidad_id'] },
        { model: Escuela, as: 'escuela', attributes: ['id', 'nombre', 'circuito_id'] },
        { model: Mesa, as: 'mesa', attributes: ['id', 'numero', 'escuela_id'] }
      ]
    });

    // Transform data to match frontend expectations
    const transformedAccess = userAccess.map(access => {
      const accessData = {
        id: access.id,
        status: access.status
      };

      if (access.localidad) {
        accessData.localidad_id = access.localidad.id;
        accessData.localidad_name = access.localidad.nombre;
      }
      if (access.circuito) {
        accessData.circuito_id = access.circuito.id;
        accessData.circuito_name = access.circuito.nombre;
        accessData.localidad_id = access.circuito.localidad_id;
      }
      if (access.escuela) {
        accessData.escuela_id = access.escuela.id;
        accessData.escuela_name = access.escuela.nombre;
        accessData.circuito_id = access.escuela.circuito_id;
      }
      if (access.mesa) {
        accessData.mesa_id = access.mesa.id;
        accessData.mesa_numero = access.mesa.numero;
        accessData.escuela_id = access.mesa.escuela_id;
      }

      return accessData;
    });

    res.json({
      success: true,
      data: transformedAccess
    });
  } catch (error) {
    console.error('Get user access error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/users/access - Create user access record
router.post('/access', hasPermission('users.create'), async (req, res) => {
  try {
    const { user_id, localidad_id, circuito_id, escuela_id, mesa_id, status = 'active' } = req.body;
    
    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    // Validate that at least one entity is specified
    if (!localidad_id && !circuito_id && !escuela_id && !mesa_id) {
      return res.status(400).json({
        success: false,
        message: 'At least one entity (localidad, circuito, escuela, or mesa) must be specified'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create user access record
    const userAccess = await UserAccess.create({
      user_id,
      localidad_id,
      circuito_id,
      escuela_id,
      mesa_id,
      status
    });

    res.json({
      success: true,
      data: userAccess,
      message: 'User access record created successfully'
    });
  } catch (error) {
    console.error('Create user access error:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'User already has access to this combination of entities'
      });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/access - Delete specific user access record
router.delete('/access', hasPermission('users.update'), async (req, res) => {
  try {
    const { user_id, localidad_id, circuito_id, escuela_id, mesa_id } = req.body;
    
    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    // Validate that at least one entity is specified
    if (!localidad_id && !circuito_id && !escuela_id && !mesa_id) {
      return res.status(400).json({
        success: false,
        message: 'At least one entity (localidad, circuito, escuela, or mesa) must be specified'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build where condition for specific access record
    const whereCondition = { user_id };
    if (localidad_id) whereCondition.localidad_id = localidad_id;
    if (circuito_id) whereCondition.circuito_id = circuito_id;
    if (escuela_id) whereCondition.escuela_id = escuela_id;
    if (mesa_id) whereCondition.mesa_id = mesa_id;

    // Delete specific access record
    const deletedCount = await UserAccess.destroy({
      where: whereCondition
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No access record found matching the specified criteria'
      });
    }

    res.json({
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} access record(s) successfully`
    });
  } catch (error) {
    console.error('Delete specific user access error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id/access - Delete all access levels for a specific user
router.delete('/:id/access', hasPermission('users.update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all access levels for this user
    const deletedCount = await UserAccess.destroy({
      where: { user_id: userId }
    });

    res.json({
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} access level records for user`
    });
  } catch (error) {
    console.error('Delete user access error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users - List all users with pagination
router.get('/', affiliateMiddleware, requireAffiliate, hasPermission('users.read'), filterEntitiesByUserAccess('users'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role_id, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role_id) where.role_id = role_id;
    if (status) where.status = status;
    if (search) {
      Object.assign(where, createSearchCondition(
        search, 
        ['first_name', 'last_name', 'email', 'dni', 'telefono'], // Todos los campos
        { integerFields: ['dni'] } // Integers en el objeto options
      ));
    }



    const users = await User.findAndCountAll({
      where,
      include: [
        { model: Role, as: 'role' },
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: req.affiliateId },
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/my-team - Get current user's team hierarchy (pyramidal structure)
router.get('/my-team', affiliateMiddleware, requireAffiliate, hasPermission('users.read'), async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { loadLevel = 'direct' } = req.query; // 'minimal', 'direct', 'full'
    
    // Get current user with role and hierarchical relationships, filtered by affiliate
    const currentUser = await User.findOne({
      where: { id: currentUserId },
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: UserAccess,
          as: 'access_assignments',
          include: [
            { model: Localidad, as: 'localidad' },
            { model: Circuito, as: 'circuito' },
            { model: Escuela, as: 'escuela' },
            { model: Mesa, as: 'mesa', include: [{ model: Escuela, as: 'escuela' }] }
          ]
        },
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: req.affiliateId },
          through: { attributes: [] }
        }
      ]
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get hierarchy based on entity assignments instead of created_by
    const hierarchyData = await getEntityBasedHierarchy(currentUser, req.affiliateId, loadLevel);

    res.json({
      success: true,
      data: hierarchyData
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/:id - Get single user
router.get('/:id', affiliateMiddleware, requireAffiliate, hasPermission('users.read'), async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id },
      include: [
        { model: Role, as: 'role' },
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: req.affiliateId },
          through: { attributes: [] }
        },
        {
          model: UserAccess,
          as: 'access_assignments',
          include: [
            {
              model: Localidad,
              as: 'localidad',
              attributes: ['id', 'nombre']
            },
            {
              model: Circuito,
              as: 'circuito',
              attributes: ['id', 'nombre', 'localidad_id']
            },
            {
              model: Escuela,
              as: 'escuela',
              attributes: ['id', 'nombre', 'circuito_id']
            },
            {
              model: Mesa,
              as: 'mesa',
              attributes: ['id', 'numero', 'escuela_id']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add affiliate_ids for easier frontend handling
    const userData = user.toJSON();
    userData.affiliate_ids = user.affiliates ? user.affiliates.map(a => a.id) : [];

    // Transform access_assignments to match AccessLevelSelector format
    if (user.access_assignments && user.access_assignments.length > 0) {
      const transformedAccess = user.access_assignments.map(access => {
        if (access.localidad) {
          return {
            entity_type: 'localidades',
            entity_id: access.localidad.id,
            entity_name: access.localidad.nombre,
            parent_id: null
          };
        } else if (access.circuito) {
          return {
            entity_type: 'circuitos',
            entity_id: access.circuito.id,
            entity_name: access.circuito.nombre,
            parent_id: access.circuito.localidad_id
          };
        } else if (access.escuela) {
          return {
            entity_type: 'escuelas',
            entity_id: access.escuela.id,
            entity_name: access.escuela.nombre,
            parent_id: access.escuela.circuito_id
          };
        } else if (access.mesa) {
          return {
            entity_type: 'mesas',
            entity_id: access.mesa.id,
            entity_name: access.mesa.numero,
            parent_id: access.mesa.escuela_id
          };
        }
        return null;
      }).filter(Boolean);

      userData.access_levels = transformedAccess;
    } else {
      userData.access_levels = [];
    }

    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/users - Create new user
router.post('/', hasPermission('users.create'), validateRoleHierarchy, validateUserData, async (req, res) => {
  try {
    const { affiliate_ids, ...userData } = req.body;
    
    // Add created_by field from the authenticated user
    userData.created_by = req.user.id;
    
    // Create user
    const user = await User.create(userData);
    
    // Handle affiliates if provided
    if (affiliate_ids && Array.isArray(affiliate_ids) && affiliate_ids.length > 0) {
      const affiliateRecords = affiliate_ids.map(affiliateId => ({
        user_id: user.id,
        affiliate_id: affiliateId
      }));
      await UserAffiliate.bulkCreate(affiliateRecords);
    }
    
    // Fetch the created user with role and affiliates
    const createdUser = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        {
          model: Affiliate,
          as: 'affiliates',
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({ success: true, data: createdUser });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Error de validación',
        details: validationErrors,
        message: 'Por favor, verifica los datos ingresados'
      });
    }
    
    // Handle other Sequelize errors
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Error en la base de datos',
        message: 'Los datos ingresados no son válidos para la base de datos'
      });
    }
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Referencia inválida',
        message: 'Uno de los datos ingresados hace referencia a un registro que no existe'
      });
    }
    
    // Generic server error for unexpected errors
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado. Por favor, intenta más tarde.'
    });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/:id', hasPermission('users.update'), validateUserData, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user is not admin then only could delete an user with same crated_by, otherwse dropr error
    if (req.user.role.name !== 'admin' && req.user.role.name !== 'responsable_localidad' && user.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para editar este usuario' });
    }

    const { affiliate_ids, ...userData } = req.body;
    
    // Update user
    await user.update(userData);
    
    // Handle affiliates update if provided
    if (affiliate_ids !== undefined) {
      // Remove existing affiliates
      await UserAffiliate.destroy({
        where: { user_id: user.id }
      });
      
      // Add new affiliates if any
      if (Array.isArray(affiliate_ids) && affiliate_ids.length > 0) {
        const affiliateRecords = affiliate_ids.map(affiliateId => ({
          user_id: user.id,
          affiliate_id: affiliateId
        }));
        await UserAffiliate.bulkCreate(affiliateRecords);
      }
    }
    
    // Fetch updated user with role and affiliates
    const updatedUser = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        {
          model: Affiliate,
          as: 'affiliates',
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Error de validación',
        details: validationErrors,
        message: 'Por favor, verifica los datos ingresados'
      });
    }
    
    // Handle other Sequelize errors
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Error en la base de datos',
        message: 'Los datos ingresados no son válidos para la base de datos'
      });
    }
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Referencia inválida',
        message: 'Uno de los datos ingresados hace referencia a un registro que no existe'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado. Por favor, intenta más tarde.'
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', hasPermission('users.delete'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }


    // If user is not admin then only could delete an user with same crated_by, otherwse dropr error
    if (req.user.role.name !== 'admin' && user.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este usuario' });
    }

    // Prevent deletion of current user
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    await user.destroy();
    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// ============================================================================
// HELPER FUNCTIONS FOR TEAM HIERARCHY
// ============================================================================

/**
 * Check if a user has created other users
 * @param {number} userId - User ID to check
 * @param {number} affiliateId - Affiliate ID to filter by
 * @param {number} excludeUserId - Optional user ID to exclude from count
 * @returns {Promise<boolean>} True if user has created other users
 */
async function hasCreatedUsers(userId, affiliateId, excludeUserId = null) {
  try {
    const whereClause = { created_by: userId };
    if (excludeUserId) {
      whereClause.id = { [Op.ne]: excludeUserId };
    }
    
    const count = await User.count({
      where: whereClause,
      include: [
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: affiliateId },
          through: { attributes: [] }
        }
      ]
    });
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if user has created users:', error);
    return false;
  }
}

/**
 * Count all descendants of a user recursively
 * @param {number} userId - User ID to count descendants for
 * @param {number} affiliateId - Affiliate ID to filter by
 * @returns {Promise<number>} Total count of descendants
 */
async function countAllDescendants(userId, affiliateId) {
  try {
    let totalCount = 0;
    const queue = [userId];
    
    while (queue.length > 0) {
      const currentUserId = queue.shift();
      
      const children = await User.findAll({
        where: { created_by: currentUserId },
      include: [
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: affiliateId },
          through: { attributes: [] }
        }
        ],
        attributes: ['id']
      });
      
      totalCount += children.length;
      
      // Add children IDs to queue for next iteration
      children.forEach(child => queue.push(child.id));
    }
    
    return totalCount;
  } catch (error) {
    console.error('Error counting descendants:', error);
    return 0;
  }
}

/**
 * Calculate the hierarchy level of a user
 * @param {number} userId - User ID to calculate level for
 * @param {number} affiliateId - Affiliate ID to filter by
 * @returns {Promise<number>} Hierarchy level (0 = root, 1 = first level, etc.)
 */
async function getHierarchyLevel(userId, affiliateId) {
  try {
    let level = 0;
    let currentUserId = userId;
    
    while (currentUserId) {
      const user = await User.findOne({
        where: { id: currentUserId },
      include: [
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: affiliateId },
          through: { attributes: [] }
        }
      ],
        attributes: ['created_by']
      });
      
      if (user && user.created_by) {
        level++;
        currentUserId = user.created_by;
      } else {
        break;
      }
    }
    
    return level;
  } catch (error) {
    console.error('Error calculating hierarchy level:', error);
    return 0;
  }
}

/**
 * Get team hierarchy based on entity assignments instead of created_by relationships
 * @param {Object} currentUser - Current user object with role and access_assignments
 * @param {number} affiliateId - Affiliate ID to filter by
 * @param {string} loadLevel - Level of detail to load ('minimal', 'direct', 'full')
 * @returns {Promise<Object>} Hierarchy data with superiors, siblings, and subordinates
 */
async function getEntityBasedHierarchy(currentUser, affiliateId, loadLevel) {
  try {
    const currentUserRole = currentUser.role.name;
    const currentUserAccess = currentUser.access_assignments || [];
    
    if (currentUserAccess.length === 0) {
      return {
        currentUser: {
          ...currentUser.toJSON(),
          dni: currentUser.dni,
          telefono: currentUser.telefono,
          hasChildren: false
        },
        superiors: [],
        siblings: [],
        subordinates: [],
        assignments: currentUserAccess,
        totalTeamSize: 0,
        userLevel: 0,
        loadLevel
      };
    }

    // Get superiors based on entity hierarchy
    const superiors = await getSuperiorsByEntityHierarchy(currentUser, currentUserAccess, affiliateId, loadLevel);
    
    // Get siblings based on same entity level
    const siblings = await getSiblingsByEntityLevel(currentUser, currentUserAccess, affiliateId, loadLevel);
    
    // Get subordinates based on entity hierarchy
    const subordinates = await getSubordinatesByEntityHierarchy(currentUser, currentUserAccess, affiliateId, loadLevel);

    // Calculate total team size
    const totalTeamSize = superiors.length + siblings.length + subordinates.length;

    return {
      currentUser: {
        ...currentUser.toJSON(),
        dni: currentUser.dni,
        telefono: currentUser.telefono,
        hasChildren: subordinates.length > 0
      },
      superiors,
      siblings,
      subordinates,
      assignments: currentUserAccess,
      totalTeamSize,
      userLevel: await calculateEntityHierarchyLevel(currentUser, currentUserAccess),
      loadLevel
    };
  } catch (error) {
    console.error('Error getting entity-based hierarchy:', error);
    throw error;
  }
}

/**
 * Get superiors based on entity hierarchy
 * @param {Object} currentUser - Current user object
 * @param {Array} currentUserAccess - Current user's access assignments
 * @param {number} affiliateId - Affiliate ID
 * @param {string} loadLevel - Level of detail
 * @returns {Promise<Array>} Array of superior users
 */
async function getSuperiorsByEntityHierarchy(currentUser, currentUserAccess, affiliateId, loadLevel) {
  const superiors = [];
  
  for (const access of currentUserAccess) {
    if (access.mesa) {
      // Fiscal de Mesa: superiors are Fiscales Generales of the same school
      const fiscalesGenerales = await getUsersByRoleAndEntity('fiscal_general', 'escuela', access.mesa.escuela_id, affiliateId);
      superiors.push(...fiscalesGenerales);
      
      // Also get Responsable de Circuito of the school's circuit
      if (access.mesa.escuela && access.mesa.escuela.circuito_id) {
        const responsablesCircuito = await getUsersByRoleAndEntity('responsable_circuito', 'circuito', access.mesa.escuela.circuito_id, affiliateId);
        superiors.push(...responsablesCircuito);
        
        // Get Responsable de Localidad of the circuit's localidad
        if (access.mesa.escuela.circuito && access.mesa.escuela.circuito.localidad_id) {
          const responsablesLocalidad = await getUsersByRoleAndEntity('responsable_localidad', 'localidad', access.mesa.escuela.circuito.localidad_id, affiliateId);
          superiors.push(...responsablesLocalidad);
        }
      }
    } else if (access.escuela) {
      // Fiscal General: superiors are Responsable de Circuito of the school's circuit
      if (access.escuela.circuito_id) {
        const responsablesCircuito = await getUsersByRoleAndEntity('responsable_circuito', 'circuito', access.escuela.circuito_id, affiliateId);
        superiors.push(...responsablesCircuito);
        
        // Get Responsable de Localidad of the circuit's localidad
        if (access.escuela.circuito && access.escuela.circuito.localidad_id) {
          const responsablesLocalidad = await getUsersByRoleAndEntity('responsable_localidad', 'localidad', access.escuela.circuito.localidad_id, affiliateId);
          superiors.push(...responsablesLocalidad);
        }
      }
    } else if (access.circuito) {
      // Responsable de Circuito: superiors are Responsable de Localidad of the circuit's localidad
      if (access.circuito.localidad_id) {
        const responsablesLocalidad = await getUsersByRoleAndEntity('responsable_localidad', 'localidad', access.circuito.localidad_id, affiliateId);
        superiors.push(...responsablesLocalidad);
      }
    }
    // Responsable de Localidad has no superiors in this hierarchy
  }

  // Remove duplicates and current user
  const uniqueSuperiors = superiors.filter((superior, index, self) => 
    superior.id !== currentUser.id && 
    self.findIndex(s => s.id === superior.id) === index
  );

  return uniqueSuperiors;
}

/**
 * Get siblings based on same entity level
 * @param {Object} currentUser - Current user object
 * @param {Array} currentUserAccess - Current user's access assignments
 * @param {number} affiliateId - Affiliate ID
 * @param {string} loadLevel - Level of detail
 * @returns {Promise<Array>} Array of sibling users
 */
async function getSiblingsByEntityLevel(currentUser, currentUserAccess, affiliateId, loadLevel) {
  const siblings = [];
  
  for (const access of currentUserAccess) {
    if (access.mesa) {
      // Fiscal de Mesa: siblings are other Fiscales de Mesa of the same school
      const fiscalesMesa = await getUsersByRoleAndEntity('fiscal_mesa', 'escuela', access.mesa.escuela_id, affiliateId);
      siblings.push(...fiscalesMesa);
    } else if (access.escuela) {
      // Fiscal General: siblings are other Fiscales Generales of the same school
      const fiscalesGenerales = await getUsersByRoleAndEntity('fiscal_general', 'escuela', access.escuela.id, affiliateId);
      siblings.push(...fiscalesGenerales);
    } else if (access.circuito) {
      // Responsable de Circuito: siblings are other Responsables de Circuito of the same localidad
      const responsablesCircuito = await getUsersByRoleAndEntity('responsable_circuito', 'localidad', access.circuito.localidad_id, affiliateId);
      siblings.push(...responsablesCircuito);
    } else if (access.localidad) {
      // Responsable de Localidad: siblings are other Responsables de Localidad
      const responsablesLocalidad = await getUsersByRoleAndEntity('responsable_localidad', null, null, affiliateId);
      siblings.push(...responsablesLocalidad);
    }
  }

  // Remove duplicates and current user
  const uniqueSiblings = siblings.filter((sibling, index, self) => 
    sibling.id !== currentUser.id && 
    self.findIndex(s => s.id === sibling.id) === index
  );

  return uniqueSiblings;
}

/**
 * Get subordinates based on entity hierarchy
 * @param {Object} currentUser - Current user object
 * @param {Array} currentUserAccess - Current user's access assignments
 * @param {number} affiliateId - Affiliate ID
 * @param {string} loadLevel - Level of detail
 * @returns {Promise<Array>} Array of subordinate users
 */
async function getSubordinatesByEntityHierarchy(currentUser, currentUserAccess, affiliateId, loadLevel) {
  const subordinates = [];
  
  for (const access of currentUserAccess) {
    if (access.localidad) {
      // Responsable de Localidad: subordinates are all Responsables de Circuito of this localidad
      const responsablesCircuito = await getUsersByRoleAndEntity('responsable_circuito', 'localidad', access.localidad.id, affiliateId);
      subordinates.push(...responsablesCircuito);
      
      // Also get all Fiscales Generales and Fiscales de Mesa in this localidad
      const fiscalesGenerales = await getUsersByRoleAndEntity('fiscal_general', 'localidad', access.localidad.id, affiliateId);
      const fiscalesMesa = await getUsersByRoleAndEntity('fiscal_mesa', 'localidad', access.localidad.id, affiliateId);
      subordinates.push(...fiscalesGenerales, ...fiscalesMesa);
      
    } else if (access.circuito) {
      // Responsable de Circuito: subordinates are all Fiscales Generales of schools in this circuit
      const fiscalesGenerales = await getUsersByRoleAndEntity('fiscal_general', 'circuito', access.circuito.id, affiliateId);
      subordinates.push(...fiscalesGenerales);
      
      // Also get all Fiscales de Mesa in this circuit
      const fiscalesMesa = await getUsersByRoleAndEntity('fiscal_mesa', 'circuito', access.circuito.id, affiliateId);
      subordinates.push(...fiscalesMesa);
      
    } else if (access.escuela) {
      // Fiscal General: subordinates are all Fiscales de Mesa of this school
      const fiscalesMesa = await getUsersByRoleAndEntity('fiscal_mesa', 'escuela', access.escuela.id, affiliateId);
      subordinates.push(...fiscalesMesa);
    }
    // Fiscal de Mesa has no subordinates in this hierarchy
  }

  // Remove duplicates and current user
  const uniqueSubordinates = subordinates.filter((subordinate, index, self) => 
    subordinate.id !== currentUser.id && 
    self.findIndex(s => s.id === subordinate.id) === index
  );

  return uniqueSubordinates;
}

/**
 * Get users by role and entity
 * @param {string} roleName - Role name to filter by
 * @param {string} entityType - Entity type to filter by ('localidad', 'circuito', 'escuela', 'mesa')
 * @param {number} entityId - Entity ID to filter by
 * @param {number} affiliateId - Affiliate ID to filter by
 * @returns {Promise<Array>} Array of users
 */
async function getUsersByRoleAndEntity(roleName, entityType, entityId, affiliateId) {
  try {
    if (!entityId) return [];

    // Step 1: Get all relevant entity IDs based on hierarchy
    let entityIds = [];
    
    if (entityType === 'localidad') {
      // For localidad: get all circuitos, escuelas, and mesas in this localidad
      const circuitos = await Circuito.findAll({ where: { localidad_id: entityId } });
      const circuitoIds = circuitos.map(c => c.id);
      
      const escuelas = await Escuela.findAll({ where: { circuito_id: { [Op.in]: circuitoIds } } });
      const escuelaIds = escuelas.map(e => e.id);
      
      const mesas = await Mesa.findAll({ where: { escuela_id: { [Op.in]: escuelaIds } } });
      const mesaIds = mesas.map(m => m.id);
      
      entityIds = [
        { localidad_id: entityId },
        ...circuitoIds.map(id => ({ circuito_id: id })),
        ...escuelaIds.map(id => ({ escuela_id: id })),
        ...mesaIds.map(id => ({ mesa_id: id }))
      ];
    } else if (entityType === 'circuito') {
      // For circuito: get all escuelas and mesas in this circuito
      const escuelas = await Escuela.findAll({ where: { circuito_id: entityId } });
      const escuelaIds = escuelas.map(e => e.id);
      
      const mesas = await Mesa.findAll({ where: { escuela_id: { [Op.in]: escuelaIds } } });
      const mesaIds = mesas.map(m => m.id);
      
      entityIds = [
        { circuito_id: entityId },
        ...escuelaIds.map(id => ({ escuela_id: id })),
        ...mesaIds.map(id => ({ mesa_id: id }))
      ];
    } else if (entityType === 'escuela') {
      // For escuela: get all mesas in this escuela
      const mesas = await Mesa.findAll({ where: { escuela_id: entityId } });
      const mesaIds = mesas.map(m => m.id);
      
      entityIds = [
        { escuela_id: entityId },
        ...mesaIds.map(id => ({ mesa_id: id }))
      ];
    } else if (entityType === 'mesa') {
      entityIds = [{ mesa_id: entityId }];
    }

    if (entityIds.length === 0) return [];

    // Step 2: Build OR conditions for UserAccess
    const accessConditions = entityIds.map(condition => ({
      ...condition,
      status: 'active'
    }));

    // Step 3: Find users with the specified role and access to any of these entities
    const users = await User.findAll({
      where: { status: 'active' },
      include: [
        { 
          model: Role, 
          as: 'role',
          where: roleName ? { name: roleName } : {}
        },
        {
          model: UserAccess,
          as: 'access_assignments',
          where: {
            [Op.or]: accessConditions
          },
          include: [
            { model: Localidad, as: 'localidad' },
            { model: Circuito, as: 'circuito' },
            { model: Escuela, as: 'escuela' },
            { model: Mesa, as: 'mesa' }
          ]
        },
        {
          model: Affiliate,
          as: 'affiliates',
          where: { id: affiliateId },
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    return users.map(user => ({
      ...user.toJSON(),
      hasChildren: false // Will be calculated if needed
    }));
  } catch (error) {
    console.error(`Error getting users by role ${roleName} and entity ${entityType}:`, error);
    return [];
  }
}

/**
 * Calculate entity hierarchy level
 * @param {Object} currentUser - Current user object
 * @param {Array} currentUserAccess - Current user's access assignments
 * @returns {Promise<number>} Hierarchy level
 */
async function calculateEntityHierarchyLevel(currentUser, currentUserAccess) {
  if (currentUserAccess.length === 0) return 0;
  
  // Determine level based on highest entity assignment
  let highestLevel = 0;
  
  for (const access of currentUserAccess) {
    if (access.localidad) {
      highestLevel = Math.max(highestLevel, 4); // Responsable de Localidad
    } else if (access.circuito) {
      highestLevel = Math.max(highestLevel, 3); // Responsable de Circuito
    } else if (access.escuela) {
      highestLevel = Math.max(highestLevel, 2); // Fiscal General
    } else if (access.mesa) {
      highestLevel = Math.max(highestLevel, 1); // Fiscal de Mesa
    }
  }
  
  return 4 - highestLevel; // Invert so higher roles have lower numbers
}

module.exports = router; 