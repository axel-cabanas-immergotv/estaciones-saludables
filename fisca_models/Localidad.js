const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Localidad = sequelize.define('Localidad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre de la localidad'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'localidades',
    indexes: [
      {
        fields: ['nombre']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Localidad;
}; 