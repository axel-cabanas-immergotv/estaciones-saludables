const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAffiliate = sequelize.define('UserAffiliate', {
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
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    affiliate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'affiliates',
        key: 'id'
      },
            onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  }, {
    tableName: 'user_affiliates',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'affiliate_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['affiliate_id']
      }
    ]
  });

  // Class methods
  UserAffiliate.findByUser = function(userId) {
    return this.findAll({
      where: {
        user_id: userId
      }
    });
  };

  UserAffiliate.findByAffiliate = function(affiliateId) {
    return this.findAll({
      where: {
        affiliate_id: affiliateId
      }
    });
  };

  return UserAffiliate;
}; 