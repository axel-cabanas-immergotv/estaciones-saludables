const { User } = require('../models');

/**
 * Middleware to validate user data before creation/update
 */
const validateUserData = async (req, res, next) => {
  try {
    const { email, dni, telefono } = req.body;
    const userId = req.params.id; // For updates
  
    
    // Check for duplicate DNI
    if (dni) {
      const dniWhere = { dni: dni };
      if (userId) dniWhere.id = { [require('sequelize').Op.ne]: userId };
      
      const existingDNI = await User.findOne({ where: dniWhere });
      if (existingDNI) {
        return res.status(409).json({
          success: false,
          error: 'El DNI ya está registrado en el sistema',
          field: 'dni',
          message: 'El DNI ya está registrado en el sistema'
        });
      }
    }
    
    // Check for duplicate phone
    if (telefono) {
      const phoneWhere = { telefono: telefono.toString() };
      if (userId) phoneWhere.id = { [require('sequelize').Op.ne]: userId };
      
      const existingPhone = await User.findOne({ where: phoneWhere });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: 'El número de teléfono ya está registrado en el sistema',
          field: 'telefono',
          message: 'El número de teléfono ya está registrado en el sistema'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('User validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error de validación',
      message: 'Error al validar los datos del usuario'
    });
  }
};

module.exports = { validateUserData };
