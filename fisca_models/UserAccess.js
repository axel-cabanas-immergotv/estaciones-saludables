const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAccess = sequelize.define('UserAccess', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    localidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'localidades',
        key: 'id'
      }
    },
    circuito_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'circuitos',
        key: 'id'
      }
    },
    escuela_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'escuelas',
        key: 'id'
      }
    },
    mesa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mesas',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'users_access',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['localidad_id']
      },
      {
        fields: ['circuito_id']
      },
      {
        fields: ['escuela_id']
      },
      {
        fields: ['mesa_id']
      },
      {
        unique: true,
        fields: ['user_id', 'localidad_id', 'circuito_id', 'escuela_id', 'mesa_id'],
        name: 'unique_user_access'
      }
    ]
  });

  return UserAccess;
}; 