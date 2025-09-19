#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

/**
 * Script para ejecutar la migración inicial del sistema Estaciones Saludables
 * 
 * Uso:
 *   node migrations/run-migration.js                    # Ejecutar migración normal
 *   node migrations/run-migration.js --down             # Revertir migración
 *   node migrations/run-migration.js --clean            # Clean restart (drop all tables)
 *   node migrations/run-migration.js --sync             # Sync models after migration
 *   node migrations/run-migration.js --clean --sync     # Clean restart + sync models
 */

const { sequelize } = require('../models');
const migration = require('./001_estaciones_saludables_initial_setup');

async function runMigration() {
  const args = process.argv.slice(2);
  const isRollback = args.includes('--down') || args.includes('-d');
  const isCleanRestart = args.includes('--clean') || args.includes('-c');
  const isSyncForce = args.includes('--sync') || args.includes('-s');
  
  try {
    console.log(`🔄 ${isRollback ? 'Revertiendo' : 'Ejecutando'} migración inicial...`);
    
    if (isRollback) {
      await migration.down(sequelize.getQueryInterface(), sequelize);
      console.log('✅ Migración revertida exitosamente');
    } else {
      // Pass options to migration
      const options = {
        cleanRestart: isCleanRestart,
        syncForce: isSyncForce
      };
      
      if (isCleanRestart) {
        console.log('🧹 Clean restart mode enabled');
      }
      
      if (isSyncForce) {
        console.log('🔄 Sync force mode enabled');
      }
      
      await migration.up(sequelize.getQueryInterface(), sequelize, options);
      console.log('✅ Migración ejecutada exitosamente');
    }
    
    console.log('\n📋 Resumen:');
    if (!isRollback) {
      console.log('   • Rol de administrador creado');
      console.log('   • Permisos CRUD para todas las entidades configurados');
      console.log('   • Usuario admin creado (admin@estaciones-saludables.com / 123456)');
      console.log('   • Sistema listo para gestionar Estaciones Saludables');
    } else {
      console.log('   • Todos los datos de la migración han sido eliminados');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Verificar que la base de datos esté disponible
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   • La base de datos esté ejecutándose');
    console.log('   • Las variables de entorno estén configuradas');
    console.log('   • Los modelos estén correctamente configurados');
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Sistema Estaciones Saludables - Migración Inicial\n');
  
  if (!(await checkDatabase())) {
    process.exit(1);
  }
  
  await runMigration();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration, checkDatabase };
