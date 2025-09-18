require('dotenv').config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'root',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'fisca_dev',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: process.env.DATABASE || 'sqlite',
    storage: process.env.SQLITE_STORAGE || './database.sqlite',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  test: {
    username: process.env.POSTGRES_USER || 'root',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'fisca_test',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: process.env.DATABASE || 'sqlite',
    storage: process.env.SQLITE_STORAGE || './database_test.sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
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
  }
};
