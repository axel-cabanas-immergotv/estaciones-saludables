const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique permission identifier like "stories.create"'
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Entity name like "stories", "pages", "users"'
    },
    action: {
      type: DataTypes.ENUM(
        'create',
        'read',
        'update',
        'delete',
        'update_own',
        'delete_own',
        'publish',
        'unpublish'
      ),
      allowNull: false
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System permissions cannot be deleted'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: 'Permission status - active permissions are enforced'
    }
  }, {
    tableName: 'permissions',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['entity', 'action']
      }
    ]
  });

  return Permission;
}; 