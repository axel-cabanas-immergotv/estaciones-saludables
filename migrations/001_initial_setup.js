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
      // 1. Create roles
      const roles = [
        {
          name: 'admin',
          display_name: 'Admin',
          description: 'Acceso completo a todo el sistema. Puede leer, actualizar y borrar todo.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'jefe_campana',
          display_name: 'Jefe de Campaña',
          description: 'Puede leer todo pero no actualizar. Puede crear usuarios con roles inferiores.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'responsable_localidad',
          display_name: 'Responsable de Localidad',
          description: 'Puede crear usuarios con roles inferiores.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'responsable_seccion',
          display_name: 'Responsable de Sección',
          description: 'Puede crear usuarios con roles inferiores.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'responsable_circuito',
          display_name: 'Responsable de Circuito',
          description: 'Puede crear usuarios con roles inferiores.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'fiscal_general',
          display_name: 'Fiscal General',
          description: 'Puede crear usuarios con roles inferiores.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'fiscal_mesa',
          display_name: 'Fiscal de Mesa',
          description: 'Sin permisos especiales por ahora.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'logistica',
          display_name: 'Logística',
          description: 'Rol para personal de logística.',
          is_system: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const createdRoles = await queryInterface.bulkInsert('roles', roles, { 
        returning: true,
        transaction 
      });

      // Get role IDs for later use
      const roleMap = {};
      for (const role of createdRoles) {
        roleMap[role.name] = role.id;
      }

      // 2. Create permissions for all entities
      const permissions = [
        // User permissions
        { name: 'users.create', display_name: 'Create Users', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.read', display_name: 'Read Users', entity: 'users', action: 'read', is_system: true, status: 'active' },
        { name: 'users.update', display_name: 'Update Users', entity: 'users', action: 'update', is_system: true, status: 'active' },
        { name: 'users.delete', display_name: 'Delete Users', entity: 'users', action: 'delete', is_system: true, status: 'active' },
        
        // Affiliate permissions
        { name: 'affiliates.create', display_name: 'Create Affiliates', entity: 'affiliates', action: 'create', is_system: true, status: 'active' },
        { name: 'affiliates.read', display_name: 'Read Affiliates', entity: 'affiliates', action: 'read', is_system: true, status: 'active' },
        { name: 'affiliates.update', display_name: 'Update Affiliates', entity: 'affiliates', action: 'update', is_system: true, status: 'active' },
        { name: 'affiliates.delete', display_name: 'Delete Affiliates', entity: 'affiliates', action: 'delete', is_system: true, status: 'active' },
        
        // Localidad permissions
        { name: 'localidades.create', display_name: 'Create Localidades', entity: 'localidades', action: 'create', is_system: true, status: 'active' },
        { name: 'localidades.read', display_name: 'Read Localidades', entity: 'localidades', action: 'read', is_system: true, status: 'active' },
        { name: 'localidades.update', display_name: 'Update Localidades', entity: 'localidades', action: 'update', is_system: true, status: 'active' },
        { name: 'localidades.delete', display_name: 'Delete Localidades', entity: 'localidades', action: 'delete', is_system: true, status: 'active' },
        
        // Seccion permissions
        { name: 'secciones.create', display_name: 'Create Secciones', entity: 'secciones', action: 'create', is_system: true, status: 'active' },
        { name: 'secciones.read', display_name: 'Read Secciones', entity: 'secciones', action: 'read', is_system: true, status: 'active' },
        { name: 'secciones.update', display_name: 'Update Secciones', entity: 'secciones', action: 'update', is_system: true, status: 'active' },
        { name: 'secciones.delete', display_name: 'Delete Secciones', entity: 'secciones', action: 'delete', is_system: true, status: 'active' },
        
        // Circuito permissions
        { name: 'circuitos.create', display_name: 'Create Circuitos', entity: 'circuitos', action: 'create', is_system: true, status: 'active' },
        { name: 'circuitos.read', display_name: 'Read Circuitos', entity: 'circuitos', action: 'read', is_system: true, status: 'active' },
        { name: 'circuitos.update', display_name: 'Update Circuitos', entity: 'circuitos', action: 'update', is_system: true, status: 'active' },
        { name: 'circuitos.delete', display_name: 'Delete Circuitos', entity: 'circuitos', action: 'delete', is_system: true, status: 'active' },
        
        // Escuela permissions
        { name: 'escuelas.create', display_name: 'Create Escuelas', entity: 'escuelas', action: 'create', is_system: true, status: 'active' },
        { name: 'escuelas.read', display_name: 'Read Escuelas', entity: 'escuelas', action: 'read', is_system: true, status: 'active' },
        { name: 'escuelas.update', display_name: 'Update Escuelas', entity: 'escuelas', action: 'update', is_system: true, status: 'active' },
        { name: 'escuelas.delete', display_name: 'Delete Escuelas', entity: 'escuelas', action: 'delete', is_system: true, status: 'active' },
        
        // Mesa permissions
        { name: 'mesas.create', display_name: 'Create Mesas', entity: 'mesas', action: 'create', is_system: true, status: 'active' },
        { name: 'mesas.read', display_name: 'Read Mesas', entity: 'mesas', action: 'read', is_system: true, status: 'active' },
        { name: 'mesas.update', display_name: 'Update Mesas', entity: 'mesas', action: 'update', is_system: true, status: 'active' },
        { name: 'mesas.delete', display_name: 'Delete Mesas', entity: 'mesas', action: 'delete', is_system: true, status: 'active' },
        
        // Ciudadano permissions
        { name: 'ciudadanos.create', display_name: 'Create Ciudadanos', entity: 'ciudadanos', action: 'create', is_system: true, status: 'active' },
        { name: 'ciudadanos.read', display_name: 'Read Ciudadanos', entity: 'ciudadanos', action: 'read', is_system: true, status: 'active' },
        { name: 'ciudadanos.update', display_name: 'Update Ciudadanos', entity: 'ciudadanos', action: 'update', is_system: true, status: 'active' },
        { name: 'ciudadanos.delete', display_name: 'Delete Ciudadanos', entity: 'ciudadanos', action: 'delete', is_system: true, status: 'active' },
        
        // Role permissions
        { name: 'roles.create', display_name: 'Create Roles', entity: 'roles', action: 'create', is_system: true, status: 'active' },
        { name: 'roles.read', display_name: 'Read Roles', entity: 'roles', action: 'read', is_system: true, status: 'active' },
        { name: 'roles.update', display_name: 'Update Roles', entity: 'roles', action: 'update', is_system: true, status: 'active' },
        { name: 'roles.delete', display_name: 'Delete Roles', entity: 'roles', action: 'delete', is_system: true, status: 'active' },
        
        // Permission permissions
        { name: 'permissions.create', display_name: 'Create Permissions', entity: 'permissions', action: 'create', is_system: true, status: 'active' },
        { name: 'permissions.read', display_name: 'Read Permissions', entity: 'permissions', action: 'read', is_system: true, status: 'active' },
        { name: 'permissions.update', display_name: 'Update Permissions', entity: 'permissions', action: 'update', is_system: true, status: 'active' },
        { name: 'permissions.delete', display_name: 'Delete Permissions', entity: 'permissions', action: 'delete', is_system: true, status: 'active' },

        // HIERARCHICAL ROLE CREATION PERMISSIONS
        // These permissions control which roles can create users with specific roles
        // Each permission is defined only ONCE, then assigned to multiple roles as needed
        
        { name: 'users.create.responsable_localidad', display_name: 'Create Users with Responsable de Localidad Role', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.create.responsable_seccion', display_name: 'Create Users with Responsable de Sección Role', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.create.responsable_circuito', display_name: 'Create Users with Responsable de Circuito Role', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.create.fiscal_general', display_name: 'Create Users with Fiscal General Role', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.create.fiscal_mesa', display_name: 'Create Users with Fiscal de Mesa Role', entity: 'users', action: 'create', is_system: true, status: 'active' },
        { name: 'users.create.logistica', display_name: 'Create Users with Logística Role', entity: 'users', action: 'create', is_system: true, status: 'active' }
      ];

      // Add timestamps to permissions
      const permissionsWithTimestamps = permissions.map(permission => ({
        ...permission,
        created_at: new Date(),
        updated_at: new Date()
      }));

      const createdPermissions = await queryInterface.bulkInsert('permissions', permissionsWithTimestamps, { 
        returning: true,
        transaction 
      });

      // 3. Create affiliate "LLA"
      const affiliate = await queryInterface.bulkInsert('affiliates', [{
        name: 'LLA',
        slug: 'lla',
        description: 'Affiliate inicial del sistema',
        status: 'active',
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      }], { 
        returning: true,
        transaction 
      });

      const affiliateId = affiliate[0].id;

      // 4. Create admin user
      const hashedPassword = await bcrypt.hash('123456', 12);
      const adminUser = await queryInterface.bulkInsert('users', [{
        email: 'admin@fisca.com',
        password: hashedPassword,
        first_name: 'Administrador',
        last_name: 'Sistema',
        status: 'active',
        role_id: roleMap['admin'],
        created_at: new Date(),
        updated_at: new Date()
      }], { 
        returning: true,
        transaction 
      });

      const adminUserId = adminUser[0].id;

      // 5. Associate admin user with LLA affiliate
      await queryInterface.bulkInsert('user_affiliates', [{
        user_id: adminUserId,
        affiliate_id: affiliateId,
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });

      // 6. Assign permissions to roles based on hierarchy
      const rolePermissions = [];

      // Helper function to add permissions for a role
      const addRolePermissions = (roleName, permissions) => {
        for (const permission of permissions) {
          rolePermissions.push({
            role_id: roleMap[roleName],
            permission_id: permission.id,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      };

      // Admin role - ALL permissions (acceso completo)
      addRolePermissions('admin', createdPermissions);

      // Jefe de Campaña - read all + create users with specific roles
      // Puede crear: Responsable de Localidad, Responsable de Sección, Responsable de Circuito, Fiscal General, Fiscal de Mesa, Logística
      const jefeCampanaPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        p.name === 'users.create' ||
        p.name === 'users.create.responsable_localidad' ||
        p.name === 'users.create.responsable_seccion' ||
        p.name === 'users.create.responsable_circuito' ||
        p.name === 'users.create.fiscal_general' ||
        p.name === 'users.create.fiscal_mesa' ||
        p.name === 'users.create.logistica'
      );
      addRolePermissions('jefe_campana', jefeCampanaPermissions);

      // Responsable de Localidad - read all + create users with specific roles
      // Puede crear: Responsable de Sección, Responsable de Circuito, Fiscal General, Fiscal de Mesa, Logística
      const responsableLocalidadPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        p.name === 'users.create' ||
        p.name === 'users.create.responsable_seccion' ||
        p.name === 'users.create.responsable_circuito' ||
        p.name === 'users.create.fiscal_general' ||
        p.name === 'users.create.fiscal_mesa' ||
        p.name === 'users.create.logistica'
      );
      addRolePermissions('responsable_localidad', responsableLocalidadPermissions);

      // Responsable de Sección - read all + create users with specific roles
      // Puede crear: Responsable de Circuito, Fiscal General, Fiscal de Mesa, Logística
      const responsableSeccionPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        p.name === 'users.create' ||
        p.name === 'users.create.responsable_circuito' ||
        p.name === 'users.create.fiscal_general' ||
        p.name === 'users.create.fiscal_mesa' ||
        p.name === 'users.create.logistica'
      );
      addRolePermissions('responsable_seccion', responsableSeccionPermissions);

      // Responsable de Circuito - read all + create users with specific roles
      // Puede crear: Fiscal General, Fiscal de Mesa, Logística
      const responsableCircuitoPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        p.name === 'users.create' ||
        p.name === 'users.create.fiscal_general' ||
        p.name === 'users.create.fiscal_mesa' ||
        p.name === 'users.create.logistica'
      );
      addRolePermissions('responsable_circuito', responsableCircuitoPermissions);

      // Fiscal General - read all + create users with specific roles
      // Puede crear: Fiscal de Mesa, Logística
      const fiscalGeneralPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        p.name === 'users.create' ||
        p.name === 'users.create.fiscal_mesa' ||
        p.name === 'users.create.logistica'
      );
      addRolePermissions('fiscal_general', fiscalGeneralPermissions);

      // Fiscal de Mesa - solo permisos de lectura básicos
      const fiscalMesaPermissions = createdPermissions.filter(p => p.action === 'read');
      addRolePermissions('fiscal_mesa', fiscalMesaPermissions);

      // Logística - solo permisos de lectura básicos
      const logisticaPermissions = createdPermissions.filter(p => p.action === 'read');
      addRolePermissions('logistica', logisticaPermissions);

      // Insert role permissions
      await queryInterface.bulkInsert('role_permissions', rolePermissions, { transaction });

      await transaction.commit();
      
      console.log('✅ Initial setup migration completed successfully!');
      console.log('📋 Created roles:', Object.keys(roleMap).join(', '));
      console.log('👤 Created admin user: admin@fisca.com');
      console.log('🏢 Created affiliate: LLA');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  // Method to clean database completely
  async cleanDatabase(queryInterface, Sequelize) {
    try {
      const sequelize = queryInterface.sequelize;
      const dialect = sequelize.getDialect();
      
      // Get all table names
      const tables = await queryInterface.showAllTables();
      
      if (tables.length === 0) {
        console.log('📭 Database is already empty');
        return;
      }
      
      // Filter out system tables that we shouldn't drop
      const systemTables = ['spatial_ref_sys', 'geography_columns', 'geometry_columns'];
      const userTables = tables.filter(table => !systemTables.includes(table));
      
      if (userTables.length === 0) {
        console.log('📭 No user tables to drop');
        return;
      }
      
      console.log(`🗑️  Dropping ${userTables.length} user tables...`);
      console.log(`   📋 System tables preserved: ${systemTables.join(', ')}`);
      
      // Strategy for PostgreSQL: Drop tables with CASCADE to handle foreign keys
      if (dialect === 'postgres') {
        console.log('   🔄 Using PostgreSQL CASCADE strategy...');
        
        try {
          // First, try to drop all tables in one go using a more robust approach
          const tableList = userTables.map(table => `"${table}"`).join(', ');
          await sequelize.query(`DROP TABLE IF EXISTS ${tableList} CASCADE`);
          console.log(`   ✅ Dropped all user tables in batch`);
        } catch (batchError) {
          console.log('   ⚠️  Batch drop failed, trying individual drops...');
          
          // Fallback: Drop tables individually with CASCADE
          for (const table of userTables) {
            try {
              await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
              console.log(`   ✅ Dropped table: ${table}`);
            } catch (error) {
              console.log(`   ⚠️  Could not drop table ${table}:`, error.message);
              
              // Last resort: Try without CASCADE
              try {
                await sequelize.query(`DROP TABLE IF EXISTS "${table}"`);
                console.log(`   ✅ Dropped table ${table} (without CASCADE)`);
              } catch (finalError) {
                console.log(`   ❌ Failed to drop table ${table}:`, finalError.message);
              }
            }
          }
        }
        
      } else if (dialect === 'mysql') {
        console.log('   🔄 Using MySQL strategy...');
        
        // Disable foreign key checks for MySQL
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop all tables
        for (const table of tables) {
          try {
            await queryInterface.dropTable(table, { force: true, cascade: true });
            console.log(`   ✅ Dropped table: ${table}`);
          } catch (error) {
            console.log(`   ⚠️  Could not drop table ${table}:`, error.message);
          }
        }
        
        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
      } else {
        // For SQLite and other dialects, use standard dropTable
        console.log('   🔄 Using standard dropTable strategy...');
        
        for (const table of tables) {
          try {
            await queryInterface.dropTable(table, { force: true, cascade: true });
            console.log(`   ✅ Dropped table: ${table}`);
          } catch (error) {
            console.log(`   ⚠️  Could not drop table ${table}:`, error.message);
          }
        }
      }
      
      // Reset all sequences to start from 1
      if (dialect === 'postgres') {
        console.log('   🔄 Resetting all sequences...');
        await this.resetSequences(sequelize);
      }
      
      console.log('✅ Database cleaned successfully');
      
    } catch (error) {
      console.error('❌ Error cleaning database:', error);
      throw error;
    }
  },

  // Method to reset all sequences in PostgreSQL
  async resetSequences(sequelize) {
    try {
      // Get all sequences in the current schema
      const sequences = await sequelize.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (sequences.length === 0) {
        console.log('   📭 No sequences found to reset');
        return;
      }
      
      console.log(`   🔄 Resetting ${sequences.length} sequences...`);
      
      // Reset each sequence to start from 1
      for (const seq of sequences) {
        try {
          await sequelize.query(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
          console.log(`   ✅ Reset sequence: ${seq.sequence_name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not reset sequence ${seq.sequence_name}:`, error.message);
        }
      }
      
      console.log('   ✅ All sequences reset successfully');
      
    } catch (error) {
      console.log('   ⚠️  Error resetting sequences:', error.message);
      // Don't throw error, just log it - this is not critical
    }
  },

  // Method to sync models with database
  async syncModels(Sequelize) {
    try {
      console.log('🔄 Syncing models with database...');
      
      // Import models
      const { sequelize } = require('../models');
      
      // Force sync all models
      await sequelize.sync({ force: true });
      
      console.log('✅ Models synced successfully');
      
    } catch (error) {
      console.error('❌ Error syncing models:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove in reverse order
      await queryInterface.bulkDelete('role_permissions', null, { transaction });
      await queryInterface.bulkDelete('user_affiliates', null, { transaction });
      await queryInterface.bulkDelete('users', null, { transaction });
      await queryInterface.bulkDelete('affiliates', null, { transaction });
      await queryInterface.bulkDelete('permissions', null, { transaction });
      await queryInterface.bulkDelete('roles', null, { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
