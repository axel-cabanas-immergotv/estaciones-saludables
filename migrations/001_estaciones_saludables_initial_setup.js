require('dotenv').config();
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize, options = {}) {
    // Check if clean restart is enabled via options parameter
    const cleanRestart = options.cleanRestart || false;
    const syncForce = options.syncForce || false;
    
    if (cleanRestart) {
      console.log('🧹 Clean restart enabled - Dropping all tables and constraints...');
      await this.cleanDatabase(queryInterface, Sequelize);
      
      // If sync force is enabled, sync models BEFORE creating data
      if (syncForce) {
        console.log('🔄 Sync force enabled - Syncing models with database...');
        await this.syncModels(Sequelize);
      }
    }
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Iniciando migración de Estaciones Saludables...');

      // 1. Create admin role
      console.log('📝 Creando rol de administrador...');
      const [adminRole] = await queryInterface.bulkInsert('roles', [
        {
          name: 'admin',
          display_name: 'Administrador',
          description: 'Acceso completo a todo el sistema de Estaciones Saludables',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { 
        returning: true, 
        transaction 
      });

      // 2. Create permissions for all entities
      console.log('🔐 Creando permisos del sistema...');
      const entities = ['estaciones', 'actividades', 'ciudadanos', 'usuarios', 'roles', 'permisos'];
      const actions = ['create', 'read', 'update', 'delete'];
      
      const permissions = [];
      
      entities.forEach(entity => {
        actions.forEach(action => {
          permissions.push({
            name: `${entity}.${action}`,
            display_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}`,
            description: `Permite ${action === 'create' ? 'crear' : action === 'read' ? 'leer' : action === 'update' ? 'actualizar' : 'eliminar'} ${entity}`,
            entity: entity,
            action: action,
            is_system: true,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          });
        });
      });

      const createdPermissions = await queryInterface.bulkInsert('permissions', permissions, { 
        returning: true, 
        transaction 
      });

      // 3. Assign all permissions to admin role
      console.log('🔗 Asignando permisos al rol de administrador...');
      const rolePermissions = createdPermissions.map(permission => ({
        role_id: adminRole.id,
        permission_id: permission.id,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await queryInterface.bulkInsert('role_permissions', rolePermissions, { transaction });

      // 4. Create admin user
      console.log('👤 Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      
      await queryInterface.bulkInsert('users', [
        {
          email: 'admin@estaciones-saludables.com',
          password: hashedPassword,
          first_name: 'Administrador',
          last_name: 'Sistema',
          dni: 12345678,
          telefono: '+5491123456789',
          status: 'active',
          role_id: adminRole.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await transaction.commit();
      
      console.log('✅ Migración completada exitosamente');
      console.log('');
      console.log('📋 Resumen de la migración:');
      console.log('   • Rol de administrador creado');
      console.log('   • Permisos CRUD para todas las entidades configurados');
      console.log('   • Usuario admin creado: admin@estaciones-saludables.com / 123456');
      console.log('   • Sistema listo para usar');
      
      // If sync force is enabled and clean restart was not used, sync models AFTER migration
      if (syncForce && !cleanRestart) {
        console.log('🔄 Sync force enabled - Syncing models with database...');
        await this.syncModels(Sequelize);
      }
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error durante la migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Revirtiendo migración de Estaciones Saludables...');

      // Delete in reverse order to respect foreign key constraints
      await queryInterface.bulkDelete('role_permissions', {}, { transaction });
      await queryInterface.bulkDelete('users', { email: 'admin@estaciones-saludables.com' }, { transaction });
      await queryInterface.bulkDelete('permissions', { is_system: true }, { transaction });
      await queryInterface.bulkDelete('roles', { name: 'admin' }, { transaction });

      await transaction.commit();
      console.log('✅ Migración revertida exitosamente');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir la migración:', error);
      throw error;
    }
  },

  async cleanDatabase(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    
    try {
      if (dialect === 'postgres') {
        await this.cleanPostgreSQL(queryInterface, Sequelize);
      } else if (dialect === 'mysql') {
        await this.cleanMySQL(queryInterface, Sequelize);
      } else if (dialect === 'sqlite') {
        await this.cleanSQLite(queryInterface, Sequelize);
      }
      
      console.log('✅ Base de datos limpiada exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando la base de datos:', error);
      throw error;
    }
  },

  async cleanPostgreSQL(queryInterface, Sequelize) {
    // Get all user tables (exclude system tables)
    const [results] = await queryInterface.sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'spatial_%' 
      AND tablename NOT LIKE 'geography_%'
      AND tablename NOT LIKE 'geometry_%'
      AND tablename NOT LIKE 'raster_%'
      AND tablename != 'SequelizeMeta'
    `);

    if (results.length === 0) {
      console.log('ℹ️  No hay tablas para limpiar');
      return;
    }

    const tableNames = results.map(row => row.tablename);
    console.log(`🗑️  Eliminando ${tableNames.length} tablas: ${tableNames.join(', ')}`);

    // Try to drop all tables in one go with CASCADE
    try {
      const dropStatement = `DROP TABLE IF EXISTS ${tableNames.map(name => `"${name}"`).join(', ')} CASCADE`;
      await queryInterface.sequelize.query(dropStatement);
      console.log('✅ Tablas eliminadas en lote con CASCADE');
    } catch (batchError) {
      console.log('⚠️  Drop en lote falló, intentando individualmente...');
      
      // Fallback: drop tables individually with CASCADE
      for (const tableName of tableNames) {
        try {
          await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        } catch (individualError) {
          console.log(`⚠️  No se pudo eliminar la tabla ${tableName}, intentando sin CASCADE...`);
          try {
            await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
          } catch (finalError) {
            console.log(`❌ Error eliminando tabla ${tableName}:`, finalError.message);
          }
        }
      }
    }

    // Reset sequences
    const [sequences] = await queryInterface.sequelize.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    for (const seq of sequences) {
      try {
        await queryInterface.sequelize.query(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
      } catch (seqError) {
        console.log(`⚠️  No se pudo resetear la secuencia ${seq.sequence_name}`);
      }
    }

    if (sequences.length > 0) {
      console.log(`🔄 ${sequences.length} secuencias reseteadas`);
    }
  },

  async cleanMySQL(queryInterface, Sequelize) {
    // Disable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables
    const [results] = await queryInterface.sequelize.query('SHOW TABLES');
    const tableNames = results.map(row => Object.values(row)[0]);

    // Drop all tables
    for (const tableName of tableNames) {
      if (tableName !== 'SequelizeMeta') {
        await queryInterface.dropTable(tableName, { force: true });
      }
    }

    // Re-enable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log(`🗑️  ${tableNames.length} tablas eliminadas`);
  },

  async cleanSQLite(queryInterface, Sequelize) {
    // Get all tables
    const [results] = await queryInterface.sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name != 'SequelizeMeta'
    `);

    // Drop all tables
    for (const row of results) {
      await queryInterface.dropTable(row.name, { force: true });
    }
    
    console.log(`🗑️  ${results.length} tablas eliminadas`);
  },

  async syncModels(Sequelize) {
    try {
      await Sequelize.sync({ force: true });
      console.log('✅ Modelos sincronizados con la base de datos');
    } catch (error) {
      console.error('❌ Error sincronizando modelos:', error);
      throw error;
    }
  }
};
