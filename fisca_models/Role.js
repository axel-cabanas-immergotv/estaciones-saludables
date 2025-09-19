const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System roles cannot be deleted'
    }
  }, {
    tableName: 'roles',
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  // Instance methods
  Role.prototype.hasPermission = async function(permissionName) {
    const permissions = await this.getPermissions({
      where: { name: permissionName }
    });
    return permissions.length > 0;
  };

  return Role;
}; 