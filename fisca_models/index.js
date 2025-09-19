// Load environment variables
require('dotenv').config();

const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration based on environment
function getDatabaseConfig() {
  const dbType = process.env.DATABASE || 'sqlite';
  
  if (dbType === 'postgres') {
    return {
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  } else {
    // Default to SQLite
    return {
      dialect: 'sqlite',
      storage: process.env.SQLITE_STORAGE || path.join(__dirname, '..', 'database.sqlite'),
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    };
  }
}

const sequelize = new Sequelize(getDatabaseConfig());

// Import models
const User = require('./User')(sequelize);
const Role = require('./Role')(sequelize);
const Permission = require('./Permission')(sequelize);



const File = require('./File')(sequelize);

const Affiliate = require('./Affiliate')(sequelize);
const UserAffiliate = require('./UserAffiliate')(sequelize);
const AffiliateMember = require('./AffiliateMember')(sequelize);
const Localidad = require('./Localidad')(sequelize);
const Seccion = require('./Seccion')(sequelize);
const Circuito = require('./Circuito')(sequelize);
const Escuela = require('./Escuela')(sequelize);
const Mesa = require('./Mesa')(sequelize);
const Ciudadano = require('./Ciudadano')(sequelize);
const UserAccess = require('./UserAccess')(sequelize);

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Hierarchical associations for pyramidal structure
User.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(User, { foreignKey: 'created_by', as: 'createdUsers' });

Role.belongsToMany(Permission, { 
  through: 'role_permissions', 
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});
Permission.belongsToMany(Role, { 
  through: 'role_permissions', 
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});








File.belongsTo(User, { foreignKey: 'user_id', as: 'uploader' });
User.hasMany(File, { foreignKey: 'user_id', as: 'uploaded_files' });



// Affiliate associations
User.belongsToMany(Affiliate, { 
  through: UserAffiliate, 
  foreignKey: 'user_id',
  otherKey: 'affiliate_id',
  as: 'affiliates'
});
Affiliate.belongsToMany(User, { 
  through: UserAffiliate, 
  foreignKey: 'affiliate_id',
  otherKey: 'user_id',
  as: 'users'
});

// Direct associations for UserAffiliate
UserAffiliate.belongsTo(Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate' });
UserAffiliate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Affiliate member relationships (hierarchical structure)
Affiliate.belongsToMany(Affiliate, {
  through: AffiliateMember,
  foreignKey: 'from_affiliate_id',
  otherKey: 'to_affiliate_id',
  as: 'members'
});
Affiliate.belongsToMany(Affiliate, {
  through: AffiliateMember,
  foreignKey: 'to_affiliate_id',
  otherKey: 'from_affiliate_id',
  as: 'parent_affiliates'
});

// Direct associations for AffiliateMember
AffiliateMember.belongsTo(Affiliate, { foreignKey: 'from_affiliate_id', as: 'from_affiliate' });
AffiliateMember.belongsTo(Affiliate, { foreignKey: 'to_affiliate_id', as: 'to_affiliate' });

// Fiscal Pro entities relationships
Circuito.belongsTo(Localidad, { foreignKey: 'localidad_id', as: 'localidad' });
Localidad.hasMany(Circuito, { foreignKey: 'localidad_id', as: 'circuitos' });

Escuela.belongsTo(Circuito, { foreignKey: 'circuito_id', as: 'circuito' });
Circuito.hasMany(Escuela, { foreignKey: 'circuito_id', as: 'escuelas' });

Mesa.belongsTo(Escuela, { foreignKey: 'escuela_id', as: 'escuela' });
Escuela.hasMany(Mesa, { foreignKey: 'escuela_id', as: 'mesas' });

Ciudadano.belongsTo(Mesa, { foreignKey: 'mesa_id', as: 'mesa' });
Mesa.hasMany(Ciudadano, { foreignKey: 'mesa_id', as: 'ciudadanos' });

// UserAccess associations
User.hasMany(UserAccess, { foreignKey: 'user_id', as: 'access_assignments' });
UserAccess.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

UserAccess.belongsTo(Localidad, { foreignKey: 'localidad_id', as: 'localidad' });
Localidad.hasMany(UserAccess, { foreignKey: 'localidad_id', as: 'user_assignments' });

UserAccess.belongsTo(Circuito, { foreignKey: 'circuito_id', as: 'circuito' });
Circuito.hasMany(UserAccess, { foreignKey: 'circuito_id', as: 'user_assignments' });

UserAccess.belongsTo(Escuela, { foreignKey: 'escuela_id', as: 'escuela' });
Escuela.hasMany(UserAccess, { foreignKey: 'escuela_id', as: 'user_assignments' });

UserAccess.belongsTo(Mesa, { foreignKey: 'mesa_id', as: 'mesa' });
Mesa.hasMany(UserAccess, { foreignKey: 'mesa_id', as: 'user_assignments' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,

  File,

  Affiliate,
  UserAffiliate,
  AffiliateMember,
  Localidad,
  Seccion,
  Circuito,
  Escuela,
  Mesa,
  Ciudadano,
  UserAccess
}; 