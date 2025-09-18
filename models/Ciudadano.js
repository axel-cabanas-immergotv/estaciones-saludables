const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ciudadano = sequelize.define('Ciudadano', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mesa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mesas',
        key: 'id'
      },
      comment: 'El ID de la mesa donde vota'
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del ciudadano'
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Apellido del ciudadano'
    },
    dni: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      comment: 'Documento Nacional de Identidad'
    },
    nacionalidad: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nacionalidad del ciudadano'
    },
    genero: {
      type: DataTypes.ENUM('masculino', 'femenino', 'otro'),
      allowNull: true,
      comment: 'Género del ciudadano'
    },
    domicilio: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Domicilio del ciudadano'
    },
    codigo_postal: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Código postal del domicilio'
    },
    numero_orden: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Número de orden en la mesa'
    },
    voto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si el ciudadano ya votó'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'ciudadanos',
    indexes: [
      {
        fields: ['mesa_id']
      },
      {
        unique: true,
        fields: ['dni']
      },
      {
        fields: ['apellido', 'nombre']
      },
      {
        fields: ['numero_orden']
      },
      {
        fields: ['genero']
      },
      {
        fields: ['nacionalidad']
      },
      {
        fields: ['voto']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Ciudadano;
}; 