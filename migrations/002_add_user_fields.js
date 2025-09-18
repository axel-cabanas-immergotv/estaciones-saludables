require('dotenv').config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Adding DNI and telefono fields to users table...');
      
      // Add DNI field
      await queryInterface.addColumn('users', 'dni', {
        type: Sequelize.BIGINT,
        allowNull: true, // Initially allow null for existing records
        unique: true,
        comment: 'Documento Nacional de Identidad'
      }, { transaction });

      // Add telefono field
      await queryInterface.addColumn('users', 'telefono', {
        type: Sequelize.STRING,
        allowNull: true, // Initially allow null for existing records
        comment: 'Número de teléfono de contacto'
      }, { transaction });

      // Create unique index for DNI
      await queryInterface.addIndex('users', ['dni'], {
        unique: true,
        name: 'users_dni_unique',
        transaction
      });

      // Update existing admin user with default values
      await queryInterface.sequelize.query(`
        UPDATE users 
        SET dni = 12345678, telefono = '1234567890'
        WHERE email = 'admin@fisca.com'
      `, { transaction });

      // Now make fields required for new records
      await queryInterface.changeColumn('users', 'dni', {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        comment: 'Documento Nacional de Identidad'
      }, { transaction });

      await queryInterface.changeColumn('users', 'telefono', {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Número de teléfono de contacto'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Successfully added DNI and telefono fields to users table');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back DNI and telefono fields...');
      
      // Remove unique index
      await queryInterface.removeIndex('users', 'users_dni_unique', { transaction });
      
      // Remove columns
      await queryInterface.removeColumn('users', 'dni', { transaction });
      await queryInterface.removeColumn('users', 'telefono', { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully removed DNI and telefono fields from users table');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
