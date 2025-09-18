require('dotenv').config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Adding ciudadanos.update permission to fiscal_mesa role...');
      
      // Find fiscal_mesa role
      const [fiscalMesaRole] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = 'fiscal_mesa'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!fiscalMesaRole) {
        throw new Error('Role fiscal_mesa not found');
      }

      console.log(`📋 Found fiscal_mesa role with ID: ${fiscalMesaRole.id}`);

      // Find ciudadanos.update permission
      const [ciudadanosUpdatePermission] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE name = 'ciudadanos.update'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!ciudadanosUpdatePermission) {
        throw new Error('Permission ciudadanos.update not found');
      }

      console.log(`🔑 Found ciudadanos.update permission with ID: ${ciudadanosUpdatePermission.id}`);

      // Check if the permission is already assigned
      const [existingAssignment] = await queryInterface.sequelize.query(
        `SELECT id FROM role_permissions 
         WHERE role_id = :roleId AND permission_id = :permissionId`,
        { 
          type: Sequelize.QueryTypes.SELECT, 
          replacements: { 
            roleId: fiscalMesaRole.id, 
            permissionId: ciudadanosUpdatePermission.id 
          },
          transaction 
        }
      );

      if (existingAssignment) {
        console.log('ℹ️  Permission already assigned, skipping...');
      } else {
        // Add the permission to fiscal_mesa role
        await queryInterface.bulkInsert('role_permissions', [{
          role_id: fiscalMesaRole.id,
          permission_id: ciudadanosUpdatePermission.id,
          created_at: new Date(),
          updated_at: new Date()
        }], { transaction });

        console.log('✅ Successfully added ciudadanos.update permission to fiscal_mesa role');
      }

      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
      console.log('📝 Fiscal de Mesa users can now mark citizen votes');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back ciudadanos.update permission from fiscal_mesa role...');
      
      // Find fiscal_mesa role
      const [fiscalMesaRole] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = 'fiscal_mesa'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!fiscalMesaRole) {
        console.log('⚠️  Role fiscal_mesa not found, nothing to rollback');
        await transaction.commit();
        return;
      }

      // Find ciudadanos.update permission
      const [ciudadanosUpdatePermission] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE name = 'ciudadanos.update'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!ciudadanosUpdatePermission) {
        console.log('⚠️  Permission ciudadanos.update not found, nothing to rollback');
        await transaction.commit();
        return;
      }

      // Remove the permission from fiscal_mesa role
      await queryInterface.sequelize.query(
        `DELETE FROM role_permissions 
         WHERE role_id = :roleId AND permission_id = :permissionId`,
        {
          replacements: { 
            roleId: fiscalMesaRole.id, 
            permissionId: ciudadanosUpdatePermission.id 
          },
          transaction
        }
      );
      
      await transaction.commit();
      console.log('✅ Successfully removed ciudadanos.update permission from fiscal_mesa role');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
