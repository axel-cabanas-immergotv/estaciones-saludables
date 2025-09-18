const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Affiliate = sequelize.define('Affiliate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Visible name of the affiliate'
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'URL slug for the affiliate'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the affiliate'
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Domain associated with this affiliate'
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to affiliate logo'
    },
    primary_color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Primary hex color code for affiliate branding'
    },
    secondary_color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Secondary hex color code for affiliate branding'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON settings for affiliate configuration'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Sort order for displaying affiliates'
    }
  }, {
    tableName: 'affiliates',
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['status']
      },
      {
        fields: ['sort_order']
      }
    ],
    hooks: {
      beforeCreate: (affiliate) => {
        // Auto-generate slug from name if not provided
        if (!affiliate.slug && affiliate.name) {
          affiliate.slug = affiliate.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
      },
      beforeUpdate: (affiliate) => {
        // Auto-generate slug from name if not provided
        if (!affiliate.slug && affiliate.name) {
          affiliate.slug = affiliate.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
      }
    }
  });

  // Instance methods for managing affiliate members
  Affiliate.prototype.addMember = async function(toAffiliateId, permissions = {}) {
    return await sequelize.models.AffiliateMember.create({
      from_affiliate_id: this.id,
      to_affiliate_id: toAffiliateId,
      can_use: permissions.can_use || false,
      can_copy: permissions.can_copy || false,
      can_assign: permissions.can_assign || false,
      access_publishers: permissions.access_publishers || false
    });
  };

  Affiliate.prototype.removeMember = async function(toAffiliateId) {
    return await sequelize.models.AffiliateMember.destroy({
      where: {
        from_affiliate_id: this.id,
        to_affiliate_id: toAffiliateId
      }
    });
  };

  Affiliate.prototype.updateMemberPermissions = async function(toAffiliateId, permissions) {
    return await sequelize.models.AffiliateMember.update(permissions, {
      where: {
        from_affiliate_id: this.id,
        to_affiliate_id: toAffiliateId
      }
    });
  };

  return Affiliate;
}; 