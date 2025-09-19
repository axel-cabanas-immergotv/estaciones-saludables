require('dotenv').config();

/**
 * Script de Seed para el Sistema Estaciones Saludables
 * Genera datos de prueba para todas las entidades del sistema
 * 
 * Uso:
 *   node migrations/seed_estaciones_saludables.js                    # Ejecutar seed
 *   node migrations/seed_estaciones_saludables.js --clean            # Limpiar datos existentes antes
 *   node migrations/seed_estaciones_saludables.js --clean --sync     # Clean + sync + seed
 */

const { sequelize, Estacion, Actividad, Ciudadano, Asistente, User, Role } = require('../models');
const bcrypt = require('bcryptjs');

// Data generators
const generateEstaciones = () => [
  {
    nombre: 'Estación Saludable San Fernando',
    direccion: 'Av. Pte. Perón 1234, San Fernando',
    lat: -34.4417,
    lon: -58.5594,
    status: 'active'
  },
  {
    nombre: 'Estación Saludable Vicente López',
    direccion: 'Av. Maipú 2567, Vicente López',
    lat: -34.5267,
    lon: -58.4794,
    status: 'active'
  },
  {
    nombre: 'Estación Saludable San Isidro',
    direccion: 'Av. Libertador 3890, San Isidro',
    lat: -34.4708,
    lon: -58.5069,
    status: 'active'
  },
  {
    nombre: 'Estación Saludable Tigre',
    direccion: 'Av. Cazón 1456, Tigre',
    lat: -34.4264,
    lon: -58.5797,
    status: 'active'
  },
  {
    nombre: 'Estación Saludable Malvinas Argentinas',
    direccion: 'Av. San Martín 789, Malvinas Argentinas',
    lat: -34.4611,
    lon: -58.6833,
    status: 'active'
  }
];

const generateActividades = (estaciones) => {
  const actividades = [];
  const tiposActividades = [
    { nombre: 'Yoga Matutino', profesor: 'Ana García', horario: 'Lunes a Viernes 8:00-9:00' },
    { nombre: 'Aeróbicos', profesor: 'Carlos Mendez', horario: 'Martes y Jueves 18:00-19:00' },
    { nombre: 'Pilates', profesor: 'María Rodriguez', horario: 'Lunes, Miércoles y Viernes 19:00-20:00' },
    { nombre: 'Zumba', profesor: 'Sofia López', horario: 'Miércoles y Viernes 17:00-18:00' },
    { nombre: 'Tai Chi', profesor: 'Roberto Chen', horario: 'Sábados 9:00-10:30' },
    { nombre: 'Aqua Aeróbicos', profesor: 'Elena Martín', horario: 'Martes y Jueves 16:00-17:00' },
    { nombre: 'Spinning', profesor: 'Miguel Torres', horario: 'Lunes a Viernes 7:00-8:00' },
    { nombre: 'Crossfit', profesor: 'Juan Pérez', horario: 'Lunes, Miércoles y Viernes 20:00-21:00' }
  ];

  estaciones.forEach((estacion, estacionIndex) => {
    // Cada estación tiene 4-6 actividades
    const numActividades = 4 + (estacionIndex % 3);
    const actividadesEstacion = tiposActividades.slice(0, numActividades);
    
    actividadesEstacion.forEach(actividad => {
      actividades.push({
        estacion_id: estacion.id,
        nombre: actividad.nombre,
        profesor: actividad.profesor,
        horario: actividad.horario,
        status: 'active'
      });
    });
  });
  
  return actividades;
};

const generateCiudadanos = () => {
  const ciudadanos = [];
  const nombres = [
    'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Miguel', 'Carmen', 
    'Roberto', 'Elena', 'Diego', 'Laura', 'Fernando', 'Patricia', 'Andrés',
    'Valeria', 'Sebastián', 'Mónica', 'Alejandro', 'Gabriela', 'Martín', 'Claudia'
  ];
  const apellidos = [
    'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Fernández', 
    'Gómez', 'Díaz', 'Moreno', 'Ruiz', 'Hernández', 'Jiménez', 'Álvarez', 'Romero',
    'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco'
  ];
  
  // Generar 200 ciudadanos
  for (let i = 1; i <= 200; i++) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    
    ciudadanos.push({
      nombre,
      apellido,
      dni: 20000000 + i, // DNI único
      nacionalidad: Math.random() > 0.95 ? 'extranjera' : 'argentina',
      genero: ['masculino', 'femenino', 'otro'][Math.floor(Math.random() * 3)],
      domicilio: `Calle ${Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 1000)}`,
      codigo_postal: `${1000 + Math.floor(Math.random() * 9000)}`,
      numero_orden: i,
      status: 'active'
    });
  }
  
  return ciudadanos;
};

const generateAsistentes = (ciudadanos, actividades) => {
  const asistentes = [];
  
  // Cada ciudadano se inscribe en 1-3 actividades aleatoriamente
  ciudadanos.forEach(ciudadano => {
    const numActividades = 1 + Math.floor(Math.random() * 3); // 1-3 actividades
    const actividadesSeleccionadas = [];
    
    // Seleccionar actividades únicas para este ciudadano
    while (actividadesSeleccionadas.length < numActividades) {
      const actividadAleatoria = actividades[Math.floor(Math.random() * actividades.length)];
      if (!actividadesSeleccionadas.find(a => a.id === actividadAleatoria.id)) {
        actividadesSeleccionadas.push(actividadAleatoria);
      }
    }
    
    // Crear registros de asistentes
    actividadesSeleccionadas.forEach(actividad => {
      asistentes.push({
        ciudadano_id: ciudadano.id,
        actividad_id: actividad.id,
        status: 'active'
      });
    });
  });
  
  return asistentes;
};

const generateUsers = (roles) => {
  const users = [];
  
  // Solo crear usuarios adicionales si existe el rol admin
  const adminRole = roles.find(r => r.name === 'admin');
  if (!adminRole) return users;
  
  // Crear 3 usuarios administradores adicionales
  for (let i = 2; i <= 4; i++) {
    users.push({
      email: `admin${i}@estaciones-saludables.com`,
      password: bcrypt.hashSync('123456', 12),
      first_name: `Admin${i}`,
      last_name: 'Sistema',
      dni: 12345678 + i,
      telefono: `+54911234567${i}`,
      status: 'active',
      role_id: adminRole.id,
      created_by: 1 // Creado por el admin principal
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
    console.log('🌱 Sistema Estaciones Saludables - Seed de Datos\n');
    
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
      const migration = require('./001_estaciones_saludables_initial_setup');
      await migration.up(sequelize.getQueryInterface(), sequelize, { cleanRestart: false, syncForce: false });
    }
    
    console.log('🌱 Iniciando seed de datos...');
    
    // 1. Create Estaciones
    console.log('🏢 Creando estaciones...');
    const estaciones = await Estacion.bulkCreate(generateEstaciones());
    console.log(`✅ ${estaciones.length} estaciones creadas`);
    
    // 2. Create Actividades
    console.log('🏃‍♀️ Creando actividades...');
    const actividades = await Actividad.bulkCreate(generateActividades(estaciones));
    console.log(`✅ ${actividades.length} actividades creadas`);
    
    // 3. Create Ciudadanos
    console.log('👥 Creando ciudadanos...');
    const ciudadanos = await Ciudadano.bulkCreate(generateCiudadanos());
    console.log(`✅ ${ciudadanos.length} ciudadanos creados`);
    
    // 4. Create Asistentes
    console.log('📝 Creando asistentes...');
    const asistentes = await Asistente.bulkCreate(generateAsistentes(ciudadanos, actividades));
    console.log(`✅ ${asistentes.length} asistentes creados`);
    
    // 5. Create additional Users (if roles exist)
    const roles = await Role.findAll();
    let users = [];
    
    if (roles.length > 0) {
      console.log('👤 Creando usuarios adicionales...');
      users = await User.bulkCreate(generateUsers(roles));
      console.log(`✅ ${users.length} usuarios adicionales creados`);
    }
    
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`   🏢 Estaciones: ${estaciones.length}`);
    console.log(`   🏃‍♀️ Actividades: ${actividades.length}`);
    console.log(`   👥 Ciudadanos: ${ciudadanos.length}`);
    console.log(`   📝 Asistentes: ${asistentes.length}`);
    if (users.length > 0) {
      console.log(`   👤 Usuarios adicionales: ${users.length}`);
    }
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Email: admin@estaciones-saludables.com');
    console.log('   Password: 123456');
    
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
    console.log('🗑️  Limpiando datos existentes...');
    
    const dialect = sequelize.getDialect();
    
    if (dialect === 'postgres') {
      // PostgreSQL: Use TRUNCATE CASCADE and reset sequences
      await sequelize.query('TRUNCATE TABLE asistentes, ciudadanos, actividades, estaciones CASCADE');
      
      // Reset sequences to start from 1
      const sequences = await sequelize.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name IN (
          'estaciones_id_seq', 'actividades_id_seq', 'ciudadanos_id_seq', 'asistentes_id_seq'
        )
      `, { type: sequelize.QueryTypes.SELECT });
      
      for (const seq of sequences) {
        await sequelize.query(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
      }
      
      console.log('✅ Tablas truncadas con CASCADE y secuencias reseteadas en PostgreSQL');
    } else if (dialect === 'mysql') {
      // MySQL: Disable foreign key checks, truncate, re-enable
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.query('TRUNCATE TABLE asistentes');
      await sequelize.query('TRUNCATE TABLE ciudadanos');
      await sequelize.query('TRUNCATE TABLE actividades');
      await sequelize.query('TRUNCATE TABLE estaciones');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Tablas truncadas en MySQL');
    } else {
      // SQLite and others: Use destroy with where: {}
      await Asistente.destroy({ where: {} });
      await Ciudadano.destroy({ where: {} });
      await Actividad.destroy({ where: {} });
      await Estacion.destroy({ where: {} });
      console.log('✅ Datos eliminados con destroy (SQLite)');
    }
    
    // Don't delete users, roles, permissions
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
    const tables = ['estaciones', 'actividades', 'ciudadanos', 'asistentes'];
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
