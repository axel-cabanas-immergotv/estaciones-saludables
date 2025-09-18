const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dni: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      comment: 'Documento Nacional de Identidad'
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Número de teléfono de contacto'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Usuario que creó esta cuenta (usado para jerarquía piramidal)'
    },
  }, {
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['dni']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash((user.dni).toString(), 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') || user.changed('telefono')) {
          user.password = await bcrypt.hash((user.dni).toString(), 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  

  return User;
}; 