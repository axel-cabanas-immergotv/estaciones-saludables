const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Circuito = sequelize.define('Circuito', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    localidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'localidades',
        key: 'id'
      },
      comment: 'El circuito al que pertenece'
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del circuito'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'circuitos',
    indexes: [
      {
        fields: ['localidad_id']
      },
      {
        fields: ['nombre']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Circuito;
}; 