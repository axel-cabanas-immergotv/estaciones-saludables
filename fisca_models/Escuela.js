const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Escuela = sequelize.define('Escuela', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    circuito_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'circuitos',
        key: 'id'
      },
      comment: 'El circuito al que pertenece'
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre de la escuela'
    },
    calle: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Calle donde se ubica la escuela'
    },
    altura: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Altura/numero de la calle'
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: 'Latitud de la ubicación'
    },
    lon: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: 'Longitud de la ubicación'
    },
    dificultad: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nivel de dificultad de acceso'
    },
    abierto: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si la escuela está abierta/operativa'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'escuelas',
    indexes: [
      {
        fields: ['circuito_id']
      },
      {
        fields: ['nombre']
      },
      {
        fields: ['abierto']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Escuela;
}; 