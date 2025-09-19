const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Estacion = sequelize.define('Estacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre de la estacion'
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Direccion de la estacion'
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Latitud de la estacion'
    },
    lon: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: 'Longitud de la estacion'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'estaciones',
    indexes: [
      {
        fields: ['direccion']
      },
      {
        fields: ['nombre']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Estacion;
}; 