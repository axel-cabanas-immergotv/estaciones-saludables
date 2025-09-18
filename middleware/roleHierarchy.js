const { Role } = require('../models');

// Role hierarchy definition - each role can only create users with roles below them
const ROLE_HIERARCHY = {
  'admin': ['jefe_campana', 'responsable_localidad', 'responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
  'jefe_campana': ['responsable_localidad', 'responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
  'responsable_localidad': ['responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
  'responsable_seccion': ['responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
  'responsable_circuito': ['fiscal_general', 'fiscal_mesa', 'logistica'],
  'fiscal_general': ['fiscal_mesa', 'logistica'],
  'fiscal_mesa': [], // Cannot create users
  'logistica': [] // Cannot create users
};

/**
 * Middleware to validate role hierarchy when creating users
 * Ensures users can only create accounts with roles below their own in the hierarchy
 */
const validateRoleHierarchy = async (req, res, next) => {
  try {
    const { role_id } = req.body;
    
    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }

    // Get the role that the user is trying to create
    const targetRole = await Role.findByPk(role_id);
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Get current user's role
    const currentUserRole = req.user.role;
    if (!currentUserRole) {
      return res.status(403).json({
        success: false,
        message: 'No role assigned to current user'
      });
    }

    // Admin can create any role
    if (currentUserRole.name === 'admin') {
      return next();
    }

    // Check if current user can create the target role
    const allowedRoles = ROLE_HIERARCHY[currentUserRole.name];
    
    if (!allowedRoles) {
      return res.status(403).json({
        success: false,
        message: `Role '${currentUserRole.display_name || currentUserRole.name}' cannot create users`
      });
    }

    if (!allowedRoles.includes(targetRole.name)) {
      return res.status(403).json({
        success: false,
        message: `Role '${currentUserRole.display_name || currentUserRole.name}' cannot create users with role '${targetRole.display_name || targetRole.name}'. Allowed roles: ${allowedRoles.map(r => r.replace(/_/g, ' ')).join(', ')}`
      });
    }

    next();
  } catch (error) {
    console.error('Role hierarchy validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating role hierarchy'
    });
  }
};

/**
 * Get available roles that the current user can create
 * @param {string} currentRoleName - Name of the current user's role
 * @returns {Array} Array of role names that can be created
 */
const getAvailableRolesForCreation = (currentRoleName) => {
  return ROLE_HIERARCHY[currentRoleName] || [];
};

/**
 * Check if a user can create a specific role
 * @param {string} currentRoleName - Name of the current user's role
 * @param {string} targetRoleName - Name of the role to be created
 * @returns {boolean} True if user can create the target role
 */
const canCreateRole = (currentRoleName, targetRoleName) => {
  if (currentRoleName === 'admin') return true;
  
  const allowedRoles = ROLE_HIERARCHY[currentRoleName];
  return allowedRoles ? allowedRoles.includes(targetRoleName) : false;
};

module.exports = {
  validateRoleHierarchy,
  getAvailableRolesForCreation,
  canCreateRole,
  ROLE_HIERARCHY
};
