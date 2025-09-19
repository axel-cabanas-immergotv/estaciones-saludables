const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Actividad = sequelize.define('Actividad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    estacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estaciones',
        key: 'id'
      },
      comment: 'La estacion al que pertenece'
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre de la actividad'
    },
    profesor: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Profesor de la actividad'
    },
    horario: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Horario de la actividad'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'actividades',
    indexes: [
      {
        fields: ['estacion_id']
      },
      {
        fields: ['nombre']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Actividad;
}; 