// Debug script to check database configuration
console.log('🔍 Debugging database configuration...\n');

// Load environment variables
require('dotenv').config();

console.log('📋 Environment Variables:');
console.log(`   DATABASE: ${process.env.DATABASE}`);
console.log(`   POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
console.log(`   POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
console.log(`   POSTGRES_DB: ${process.env.POSTGRES_DB}`);
console.log(`   POSTGRES_USER: ${process.env.POSTGRES_USER}`);
console.log(`   POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***SET***' : 'NOT SET'}`);

console.log('\n🔧 Testing database connection...');

async function testConnection() {
  try {
    const { sequelize } = require('../../models');
    
    console.log('✅ Models loaded successfully');
    console.log('\n📊 Sequelize Configuration:');
    console.log(`   Dialect: ${sequelize.getDialect()}`);
    console.log(`   Host: ${sequelize.config.host}`);
    console.log(`   Port: ${sequelize.config.port}`);
    console.log(`   Database: ${sequelize.config.database}`);
    console.log(`   Username: ${sequelize.config.username}`);
    
    // Test connection
    await sequelize.authenticate();
    console.log('\n✅ Database connection successful');
    
    // Test PostgreSQL-specific query
    if (sequelize.getDialect() === 'postgres') {
      console.log('\n🔍 Testing PostgreSQL-specific functionality...');
      const result = await sequelize.query(
        "SELECT version() as version",
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log(`   PostgreSQL version: ${result[0].version}`);
    } else {
      console.log('\n⚠️ Not using PostgreSQL dialect');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testConnection();
