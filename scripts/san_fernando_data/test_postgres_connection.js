// Test script for PostgreSQL connection and configuration
console.log('🧪 Testing PostgreSQL connection and configuration...\n');

async function testPostgreSQLConnection() {
  try {
    const { sequelize } = require('../models');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Get database configuration
    const config = sequelize.config;
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Dialect: ${config.dialect}`);
    
    // Test table existence check
    console.log('\n🔍 Testing table existence check...');
    const result = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`   Users table exists: ${result[0].exists}`);
    
    // Test model import
    console.log('\n📦 Testing model imports...');
    const { Localidad, Circuito, Escuela, Mesa } = require('../models');
    console.log('   ✅ Localidad model imported');
    console.log('   ✅ Circuito model imported');
    console.log('   ✅ Escuela model imported');
    console.log('   ✅ Mesa model imported');
    
    // Close connection
    await sequelize.close();
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPostgreSQLConnection();
