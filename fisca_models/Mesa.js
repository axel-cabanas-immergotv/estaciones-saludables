const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mesa = sequelize.define('Mesa', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    escuela_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'escuelas',
        key: 'id'
      },
      comment: 'La escuela a la que pertenece la mesa'
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Numero de la mesa'
    },
    mesa_testigo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si es una mesa testigo'
    },
    mesa_extranjeros: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si es una mesa para extranjeros'
    },
    mesa_abrio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si la mesa ya abrió'
    },
    acta_de_escrutinio: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File URL to S3 for acta de escrutinio'
    },
    certificado_de_escrutinio: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File URL to S3 for certificado de escrutinio'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'mesas',
    indexes: [
      {
        fields: ['escuela_id']
      },
      {
        fields: ['numero']
      },
      {
        unique: true,
        fields: ['escuela_id', 'numero'],
        name: 'unique_mesa_per_escuela'
      },
      {
        fields: ['mesa_testigo']
      },
      {
        fields: ['mesa_extranjeros']
      },
      {
        fields: ['mesa_abrio']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Mesa;
}; 