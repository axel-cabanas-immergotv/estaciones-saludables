const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AffiliateMember = sequelize.define('AffiliateMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    from_affiliate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Affiliate that owns the relationship (A in the example)'
    },
    to_affiliate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Affiliate that is a member (B in the example)'
    },
    can_use: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'B can use content from A'
    },
    can_copy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'B can copy content from A'
    },
    can_assign: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'B can assign content to A'
    },
    access_publishers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'B can access A\'s publishers'
    }
  }, {
    tableName: 'affiliate_members',
    indexes: [
      {
        unique: true,
        fields: ['from_affiliate_id', 'to_affiliate_id'],
        name: 'affiliate_members_unique_relationship'
      },
      {
        fields: ['from_affiliate_id']
      },
      {
        fields: ['to_affiliate_id']
      },
      {
        fields: ['can_use']
      },
      {
        fields: ['can_copy']
      },
      {
        fields: ['can_assign']
      },
      {
        fields: ['access_publishers']
      }
    ],
    hooks: {
      beforeCreate: (affiliateMember) => {
        // Ensure boolean fields are properly set
        affiliateMember.can_use = !!affiliateMember.can_use;
        affiliateMember.can_copy = !!affiliateMember.can_copy;
        affiliateMember.can_assign = !!affiliateMember.can_assign;
        affiliateMember.access_publishers = !!affiliateMember.access_publishers;
      },
      beforeUpdate: (affiliateMember) => {
        // Ensure boolean fields are properly set
        affiliateMember.can_use = !!affiliateMember.can_use;
        affiliateMember.can_copy = !!affiliateMember.can_copy;
        affiliateMember.can_assign = !!affiliateMember.can_assign;
        affiliateMember.access_publishers = !!affiliateMember.access_publishers;
      }
    }
  });

  // Instance methods
  AffiliateMember.prototype.hasPermission = function(permission) {
    const permissions = {
      'use': this.can_use,
      'copy': this.can_copy,
      'assign': this.can_assign,
      'publishers': this.access_publishers
    };
    return permissions[permission] || false;
  };

  AffiliateMember.prototype.getAllPermissions = function() {
    return {
      can_use: this.can_use,
      can_copy: this.can_copy,
      can_assign: this.can_assign,
      access_publishers: this.access_publishers
    };
  };

  return AffiliateMember;
}; 