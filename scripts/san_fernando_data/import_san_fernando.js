const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize, Localidad, Circuito, Escuela, Mesa, User, UserAccess } = require('../models');

// Function to read CSV file and return data as array
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to check if table exists in PostgreSQL
async function tableExists(tableName) {
  try {
    const result = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :tableName)",
      {
        replacements: { tableName },
        type: sequelize.QueryTypes.SELECT
      }
    );
    return result[0].exists;
  } catch (error) {
    console.log(`⚠️ Could not check if table ${tableName} exists:`, error.message);
    return false;
  }
}

// Function to sync database tables


// Function to clean all existing data
async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');
  
  try {
    // Check if tables exist before trying to clean them
    const ciudadanoTableExists = await tableExists('ciudadanos');
    const mesaTableExists = await tableExists('mesas');
    const escuelaTableExists = await tableExists('escuelas');
    const circuitoTableExists = await tableExists('circuitos');
    const localidadTableExists = await tableExists('localidades');
    const userTableExists = await tableExists('users');
    const userAccessTableExists = await tableExists('user_accesses');
    
    // Clean data in correct order (respecting foreign key constraints)
    // 1. First delete dependent tables (child tables)
    if (ciudadanoTableExists) {
      await sequelize.query('DELETE FROM ciudadanos');
      console.log('✅ Ciudadanos data cleaned');
    } else {
      console.log('⚠️ Ciudadanos table does not exist, skipping');
    }
    
    if (userAccessTableExists) {
      await sequelize.query('DELETE FROM user_accesses');
      console.log('✅ UserAccess data cleaned');
    } else {
      console.log('⚠️ UserAccess table does not exist, skipping');
    }
    
    // 2. Then delete main tables (parent tables)
    if (mesaTableExists) {
      await sequelize.query('DELETE FROM mesas');
      console.log('✅ Mesas data cleaned');
    } else {
      console.log('⚠️ Mesas table does not exist, skipping');
    }
    
    if (escuelaTableExists) {
      await sequelize.query('DELETE FROM escuelas');
      console.log('✅ Escuelas data cleaned');
    } else {
      console.log('⚠️ Escuelas table does not exist, skipping');
    }
    
    if (circuitoTableExists) {
      await sequelize.query('DELETE FROM circuitos');
      console.log('✅ Circuitos data cleaned');
    } else {
      console.log('⚠️ Circuitos table does not exist, skipping');
    }
    
    if (localidadTableExists) {
      await sequelize.query('DELETE FROM localidades');
      console.log('✅ Localidades data cleaned');
    } else {
      console.log('⚠️ Localidades table does not exist, skipping');
    }
    
    if (userTableExists) {
      // Delete users except admin (assuming admin has role_id = 1)
      await sequelize.query('DELETE FROM users WHERE role_id != 1');
      console.log('✅ Users data cleaned (except admin)');
    } else {
      console.log('⚠️ Users table does not exist, skipping');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

// Function to create or find localidad
async function getOrCreateLocalidad(nombre) {
  const [localidad] = await Localidad.findOrCreate({
    where: { nombre },
    defaults: {
      nombre,
      status: 'active'
    }
  });
  return localidad;
}

// Function to create or find circuito
async function getOrCreateCircuito(nombre, localidadId) {
  const [circuito] = await Circuito.findOrCreate({
    where: { nombre },
    defaults: {
      nombre,
      localidad_id: localidadId,
      status: 'active'
    }
  });
  return circuito;
}

// Function to create or update escuela
async function createOrUpdateEscuela(data, circuitoId) {
  const escuelaData = {
    nombre: data.ESTABLECIMIENTO,
    calle: data.DOMICILIO,
    circuito_id: circuitoId,
    status: 'active',
    abierto: true
  };
  
  const [escuela, created] = await Escuela.findOrCreate({
    where: { nombre: data.ESTABLECIMIENTO },
    defaults: escuelaData
  });
  
  if (!created) {
    // Update existing escuela
    await escuela.update(escuelaData);
  }
  
  return escuela;
}

// Function to create mesas for a school
async function createMesas(escuelaId, mesaDesde, mesaHasta) {
  const mesas = [];
  
  for (let numero = mesaDesde; numero <= mesaHasta; numero++) {
    mesas.push({
      escuela_id: escuelaId,
      numero: numero,
      status: 'active',
      mesa_testigo: false,
      mesa_extranjeros: false,
      mesa_abrio: false
    });
  }
  
  // Delete existing mesas for this school to avoid duplicates
  await Mesa.destroy({ where: { escuela_id: escuelaId } });
  
  // Create new mesas
  await Mesa.bulkCreate(mesas);
  
  console.log(`✅ Created ${mesas.length} mesas for escuela ${escuelaId} (${mesaDesde}-${mesaHasta})`);
}

// Main import function
async function importSanFernandoData() {
  try {
    console.log('🚀 Starting San Fernando data import...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database tables if they don't exist

    // Clean existing data
    await cleanDatabase();
    
    // Read CSV files
    const sfData = await readCSVFile(path.join(__dirname, 'SF.csv'));
    const sfeData = await readCSVFile(path.join(__dirname, 'SFE.csv'));
    
    console.log(`📊 SF.csv: ${sfData.length} records`);
    console.log(`📊 SFE.csv: ${sfeData.length} records`);
    
    // Combine both datasets
    const allData = [...sfData, ...sfeData];
    
    // Create localidad "SAN FERNANDO"
    const localidad = await getOrCreateLocalidad('SAN FERNANDO');
    console.log(`🏘️ Localidad created/found: ${localidad.nombre} (ID: ${localidad.id})`);
    
    // Process each record
    for (const record of allData) {
      try {
        // Create or find circuito
        const circuito = await getOrCreateCircuito(record['CIRCUITO ELECTORAL'], localidad.id);
        
        // Create or update escuela
        const escuela = await createOrUpdateEscuela(record, circuito.id);
        
        // Create mesas
        const mesaDesde = parseInt(record.MD);
        const mesaHasta = parseInt(record.MH);
        
        if (!isNaN(mesaDesde) && !isNaN(mesaHasta)) {
          await createMesas(escuela.id, mesaDesde, mesaHasta);
        }
        
      } catch (error) {
        console.error(`❌ Error processing record:`, record, error);
      }
    }
    
    // Final summary
    const totalLocalidades = await Localidad.count();
    const totalCircuitos = await Circuito.count();
    const totalEscuelas = await Escuela.count();
    const totalMesas = await Mesa.count();
    
    console.log('\n📈 Import Summary:');
    console.log(`🏘️ Localidades: ${totalLocalidades}`);
    console.log(`🔗 Circuitos: ${totalCircuitos}`);
    console.log(`🏫 Escuelas: ${totalEscuelas}`);
    console.log(`🗳️ Mesas: ${totalMesas}`);
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importSanFernandoData()
    .then(() => {
      console.log('🎉 Script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { importSanFernandoData };
