const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Seccion = sequelize.define('Seccion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Numero de la seccion'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'secciones',
    indexes: [
      {
        fields: ['numero']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Seccion;
}; 