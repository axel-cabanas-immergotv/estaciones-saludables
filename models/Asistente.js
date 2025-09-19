const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Asistente = sequelize.define('Asistente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ciudadano_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ciudadanos',
        key: 'id'
      },
      comment: 'El ID del ciudadano'
    },
    actividad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'actividades',
        key: 'id'
      },
      comment: 'El ID de la actividad'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'asistentes',
    indexes: [
      {
        fields: ['ciudadano_id']
      },
      {
        fields: ['actividad_id']
      }
    ]
  });

  return Asistente;
}; 