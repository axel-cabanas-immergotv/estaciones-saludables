require('dotenv').config();

/**
 * Script de Seed para el Sistema Fisca
 * Genera datos de prueba para todas las entidades del sistema
 * 
 * Uso:
 *   node migrations/seed.js                    # Ejecutar seed
 *   node migrations/seed.js --clean            # Limpiar datos existentes antes
 *   node migrations/seed.js --clean --sync     # Clean + sync + seed
 */

const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Data generators
const generateLocalidades = () => [
  { nombre: 'San Fernando', status: 'active' },
  { nombre: 'Vicente López', status: 'active' },
  { nombre: 'San Isidro', status: 'active' },
  { nombre: 'Tigre', status: 'active' },
  { nombre: 'Malvinas Argentinas', status: 'active' }
];

const generateSecciones = () => [
  { numero: 1, status: 'active' },
  { numero: 2, status: 'active' },
  { numero: 3, status: 'active' },
  { numero: 4, status: 'active' },
  { numero: 5, status: 'active' }
];

const generateCircuitos = (localidades) => {
  const circuitos = [];
  localidades.forEach((localidad, index) => {
    // Cada localidad tiene 2-3 circuitos
    for (let i = 1; i <= 2 + (index % 2); i++) {
      circuitos.push({
        localidad_id: localidad.id,
        nombre: `Circuito ${i} - ${localidad.nombre}`,
        status: 'active'
      });
    }
  });
  return circuitos;
};

const generateEscuelas = (circuitos) => {
  const escuelas = [];
  circuitos.forEach((circuito, index) => {
    // Cada circuito tiene 3-5 escuelas
    const numEscuelas = 3 + (index % 3);
    for (let i = 1; i <= numEscuelas; i++) {
      escuelas.push({
        circuito_id: circuito.id,
        nombre: `Escuela ${i} - ${circuito.nombre}`,
        calle: `Calle ${i * 10}`,
        altura: `${i * 100}`,
        lat: -34.5 + (Math.random() * 0.1),
        lon: -58.5 + (Math.random() * 0.1),
        dificultad: ['baja', 'media', 'alta'][Math.floor(Math.random() * 3)],
        abierto: Math.random() > 0.1, // 90% probabilidad de estar abierto
        status: 'active'
      });
    }
  });
  return escuelas;
};

const generateMesas = (escuelas) => {
  const mesas = [];
  let mesaCounter = 1; // Contador global para números únicos de mesa
  
  escuelas.forEach((escuela, index) => {
    // Cada escuela tiene 5-8 mesas
    const numMesas = 5 + (index % 4);
    for (let i = 1; i <= numMesas; i++) {
      mesas.push({
        escuela_id: escuela.id,
        numero: mesaCounter++, // Incrementa el contador global para cada mesa
        mesa_testigo: i === 1, // Primera mesa es testigo
        mesa_extranjeros: i === numMesas, // Última mesa es para extranjeros
        mesa_abrio: Math.random() > 0.3, // 70% probabilidad de estar abierta
        status: 'active'
      });
    }
  });
  return mesas;
};

const generateCiudadanos = (mesas) => {
  const ciudadanos = [];
  const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Miguel', 'Carmen', 'Roberto', 'Elena'];
  const apellidos = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Fernández', 'Gómez', 'Díaz', 'Moreno'];
  
  mesas.forEach((mesa, mesaIndex) => {
    // Cada mesa tiene 200-300 ciudadanos
    const numCiudadanos = 200 + Math.floor(Math.random() * 100);
    
    for (let i = 1; i <= numCiudadanos; i++) {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      
      ciudadanos.push({
        mesa_id: mesa.id,
        nombre,
        apellido,
        dni: 20000000 + (mesaIndex * 1000) + i, // DNI único
        nacionalidad: Math.random() > 0.95 ? 'extranjera' : 'argentina',
        genero: ['masculino', 'femenino', 'otro'][Math.floor(Math.random() * 3)],
        domicilio: `Calle ${Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 1000)}`,
        codigo_postal: `${1000 + Math.floor(Math.random() * 9000)}`,
        numero_orden: i,
        status: 'active'
      });
    }
  });
  
  return ciudadanos;
};

const generateUsers = (roles) => {
  const users = [];
  const hashedPassword = bcrypt.hashSync('123456', 12);
  
  // Responsable de Localidad (3 usuarios)
  const responsableLocalidadRole = roles.find(r => r.name === 'responsable_localidad');
  for (let i = 1; i <= 3; i++) {
    users.push({
      email: `responsable.localidad${i}@fisca.com`,
      password: hashedPassword,
      first_name: `Responsable${i}`,
      last_name: 'Localidad',
      status: 'active',
      role_id: responsableLocalidadRole.id,
      created_by: 1 // Admin
    });
  }
  
  // Fiscal General (3 usuarios)
  const fiscalGeneralRole = roles.find(r => r.name === 'fiscal_general');
  for (let i = 1; i <= 3; i++) {
    users.push({
      email: `fiscal.general${i}@fisca.com`,
      password: hashedPassword,
      first_name: `Fiscal${i}`,
      last_name: 'General',
      status: 'active',
      role_id: fiscalGeneralRole.id,
      created_by:  Math.floor(Math.random() * (4 - 2 + 1)) + 2
    });
  }

  // Random between 1 and N constant
  // Fiscal de Mesa (3 usuarios)
  const fiscalMesaRole = roles.find(r => r.name === 'fiscal_mesa');
  for (let i = 1; i <= 3; i++) {
    users.push({
      email: `fiscal.mesa${i}@fisca.com`,
      password: hashedPassword,
      first_name: `Fiscal${i}`,
      last_name: 'Mesa',
      status: 'active',
      role_id: fiscalMesaRole.id,
      created_by: Math.floor(Math.random() * (10 - 7 + 1)) + 7
    });
  }
  
  return users;
};

// Main seed function
async function runSeed() {
  const args = process.argv.slice(2);
  const isClean = args.includes('--clean') || args.includes('-c');
  const isSync = args.includes('--sync') || args.includes('-s');
  
  try {
    console.log('🌱 Sistema Fisca - Seed de Datos\n');
    
    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    if (isClean) {
      console.log('🧹 Clean mode enabled - Limpiando datos existentes...');
      await cleanExistingData();
    }
    
    if (isSync) {
      console.log('🔄 Sync mode enabled - Sincronizando modelos...');
      await sequelize.sync({ force: true });
      console.log('✅ Modelos sincronizados');
      
      // Re-run initial migration to create roles and permissions
      console.log('🔄 Ejecutando migración inicial...');
      const migration = require('./001_initial_setup');
      await migration.up(sequelize.getQueryInterface(), sequelize, { cleanRestart: false, syncForce: false });
    }
    
    console.log('🌱 Iniciando seed de datos...');
    
    // 1. Create Localidades
    console.log('📍 Creando localidades...');
    const localidades = await sequelize.models.Localidad.bulkCreate(generateLocalidades());
    console.log(`✅ ${localidades.length} localidades creadas`);
    
    // 2. Create Secciones
    console.log('🔢 Creando secciones...');
    const secciones = await sequelize.models.Seccion.bulkCreate(generateSecciones());
    console.log(`✅ ${secciones.length} secciones creadas`);
    
    // 3. Create Circuitos
    console.log('🔄 Creando circuitos...');
    const circuitos = await sequelize.models.Circuito.bulkCreate(generateCircuitos(localidades));
    console.log(`✅ ${circuitos.length} circuitos creados`);
    
    // 4. Create Escuelas
    console.log('🏫 Creando escuelas...');
    const escuelas = await sequelize.models.Escuela.bulkCreate(generateEscuelas(circuitos));
    console.log(`✅ ${escuelas.length} escuelas creadas`);
    
    // 5. Create Mesas
    console.log('🪑 Creando mesas...');
    const mesas = await sequelize.models.Mesa.bulkCreate(generateMesas(escuelas));
    console.log(`✅ ${mesas.length} mesas creadas`);
    
    // 6. Create Ciudadanos
    console.log('👥 Creando ciudadanos...');
    const ciudadanos = await sequelize.models.Ciudadano.bulkCreate(generateCiudadanos(mesas));
    console.log(`✅ ${ciudadanos.length} ciudadanos creados`);
    
    // 7. Create Users (if roles exist)
    const roles = await sequelize.models.Role.findAll();
    let users = [];
    
    if (roles.length > 0) {
      console.log('👤 Creando usuarios de prueba...');
      users = await sequelize.models.User.bulkCreate(generateUsers(roles));
      console.log(`✅ ${users.length} usuarios creados`);
      
      // Associate users with LLA affiliate
      const affiliate = await sequelize.models.Affiliate.findOne({ where: { slug: 'lla' } });
      if (affiliate) {
        const userAffiliates = users.map(user => ({
          user_id: user.id,
          affiliate_id: affiliate.id
        }));
        await sequelize.models.UserAffiliate.bulkCreate(userAffiliates);
        console.log('✅ Usuarios asociados al affiliate LLA');
      }
    }
    
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`   📍 Localidades: ${localidades.length}`);
    console.log(`   🔢 Secciones: ${secciones.length}`);
    console.log(`   🔄 Circuitos: ${circuitos.length}`);
    console.log(`   🏫 Escuelas: ${escuelas.length}`);
    console.log(`   🪑 Mesas: ${mesas.length}`);
    console.log(`   👥 Ciudadanos: ${ciudadanos.length}`);
    if (roles.length > 0) {
      console.log(`   👤 Usuarios: ${users.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Clean existing data function
async function cleanExistingData() {
  try {
    console.log('🗑️  Limpiando datos existentes con TRUNCATE CASCADE...');
    
    // Use TRUNCATE CASCADE for faster and more efficient cleanup
    const dialect = sequelize.getDialect();
    
    if (dialect === 'postgres') {
      // PostgreSQL: Use TRUNCATE CASCADE and reset sequences
      await sequelize.query('TRUNCATE TABLE ciudadanos, mesas, escuelas, circuitos, secciones, localidades CASCADE');
      
      // Reset sequences to start from 1
      const sequences = await sequelize.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name IN (
          'localidades_id_seq', 'secciones_id_seq', 'circuitos_id_seq', 
          'escuelas_id_seq', 'mesas_id_seq', 'ciudadanos_id_seq'
        )
      `, { type: sequelize.QueryTypes.SELECT });
      
      for (const seq of sequences) {
        await sequelize.query(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
      }
      
      console.log('✅ Tablas truncadas con CASCADE y secuencias reseteadas en PostgreSQL');
    } else if (dialect === 'mysql') {
      // MySQL: Disable foreign key checks, truncate, re-enable
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.query('TRUNCATE TABLE ciudadanos');
      await sequelize.query('TRUNCATE TABLE mesas');
      await sequelize.query('TRUNCATE TABLE escuelas');
      await sequelize.query('TRUNCATE TABLE circuitos');
      await sequelize.query('TRUNCATE TABLE secciones');
      await sequelize.query('TRUNCATE TABLE localidades');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Tablas truncadas en MySQL');
    } else {
      // SQLite and others: Use destroy with where: {}
      await sequelize.models.Ciudadano.destroy({ where: {} });
      await sequelize.models.Mesa.destroy({ where: {} });
      await sequelize.models.Escuela.destroy({ where: {} });
      await sequelize.models.Circuito.destroy({ where: {} });
      await sequelize.models.Seccion.destroy({ where: {} });
      await sequelize.models.Localidad.destroy({ where: {} });
      console.log('✅ Datos eliminados con destroy (SQLite)');
    }
    
    // Don't delete users, roles, permissions, or affiliates
    console.log('✅ Datos de entidades principales eliminados');
    
    // Verify that tables are empty
    await verifyTablesEmpty();
    
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
    throw error;
  }
}

// Function to verify that tables are empty after cleanup
async function verifyTablesEmpty() {
  try {
    const tables = ['localidades', 'secciones', 'circuitos', 'escuelas', 'mesas', 'ciudadanos'];
    const counts = {};
    
    for (const table of tables) {
      const result = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, {
        type: sequelize.QueryTypes.SELECT
      });
      counts[table] = parseInt(result[0].count);
    }
    
    const emptyTables = Object.entries(counts).filter(([table, count]) => count === 0);
    const nonEmptyTables = Object.entries(counts).filter(([table, count]) => count > 0);
    
    if (nonEmptyTables.length === 0) {
      console.log('✅ Todas las tablas están vacías');
    } else {
      console.log('⚠️  Algunas tablas no están completamente vacías:');
      nonEmptyTables.forEach(([table, count]) => {
        console.log(`   ${table}: ${count} registros`);
      });
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo verificar el estado de las tablas:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runSeed().catch(console.error);
}

module.exports = { runSeed, cleanExistingData };
