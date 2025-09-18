const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: '../../.env' });

// Import models
const { sequelize, Ciudadano, Mesa } = require('../../models');

// Configuration
const CONFIG = {
    TEST_MODE: process.argv.includes('--test'),
    MAX_TEST_RECORDS: 1,
    CSV_FILES: {
        NACIONALES: path.join(__dirname, 'SAN FERNANDO.csv'),
        EXTRANJEROS: path.join(__dirname, 'SAN FERNANDO EXTRANJEROS.csv')
    },
    BATCH_SIZE: 100 // Procesar en lotes para mejor rendimiento
};

// Logging utilities
const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    debug: (msg) => console.log(`🔍 ${msg}`)
};

// Stats tracking
const stats = {
    processed: 0,
    inserted: 0,
    errors: 0,
    mesasNotFound: 0,
    duplicates: 0
};

// Mesa cache para evitar consultas repetidas
const mesaCache = new Map();

/**
 * Obtiene el ID de la mesa basado en su número
 */
async function getMesaId(numeroMesa, isExtranjero = false) {
    const cacheKey = `${numeroMesa}`;  // Simplificado: solo usar número de mesa
    
    if (mesaCache.has(cacheKey)) {
        return mesaCache.get(cacheKey);
    }
    
    try {
        // Buscar mesa solo por número, sin importar el flag de extranjeros
        const mesa = await Mesa.findOne({
            where: { 
                numero: numeroMesa
            }
        });
        
        if (mesa) {
            mesaCache.set(cacheKey, mesa.id);
            return mesa.id;
        } else {
            log.warning(`Mesa no encontrada: ${numeroMesa} (extranjero: ${isExtranjero})`);
            stats.mesasNotFound++;
            return null;
        }
    } catch (error) {
        log.error(`Error buscando mesa ${numeroMesa}: ${error.message}`);
        return null;
    }
}

/**
 * Mapea el sexo del CSV al formato de la base de datos
 */
function mapearGenero(sexo) {
    switch(sexo?.toUpperCase()) {
        case 'M':
            return 'masculino';
        case 'F':
            return 'femenino';
        default:
            return null;
    }
}

/**
 * Parsea los datos de ciudadanos nacionales
 */
function parsearCiudadanoNacional(row) {
    // Limpiar número de mesa (remover letras como "0880A" -> "880")
    const mesaLimpia = row.NRO_MESA?.toString().replace(/[A-Za-z]/g, '').replace(/^0+/, '') || '0';
    
    return {
        dni: parseInt(row.DOCUMENTO),
        nombre: row.NOMBRE?.trim(),
        apellido: row.APELLIDO?.trim(),
        genero: mapearGenero(row.SEXO),
        domicilio: row.DOMICILIO?.trim(),
        numero_mesa: parseInt(mesaLimpia) || null,
        numero_orden: parseInt(row.ORDEN),
        nacionalidad: 'Argentina',
        isExtranjero: false
    };
}

/**
 * Parsea los datos de ciudadanos extranjeros
 */
function parsearCiudadanoExtranjero(row) {
    // Separar apellido y nombre de la columna combinada
    const apellidoYNombre = row['APELLIDO Y NOMBRE']?.trim() || '';
    const partes = apellidoYNombre.split(' ');
    
    // Asumir que los primeros 1-2 elementos son apellidos y el resto nombres
    let apellido = '';
    let nombre = '';
    
    if (partes.length >= 2) {
        // Si hay más de 2 palabras, tomar las primeras 2 como apellido
        if (partes.length > 3) {
            apellido = partes.slice(0, 2).join(' ');
            nombre = partes.slice(2).join(' ');
        } else {
            apellido = partes[0];
            nombre = partes.slice(1).join(' ');
        }
    } else {
        apellido = apellidoYNombre;
    }
    
    // Limpiar número de mesa (remover letras)
    const mesaLimpia = row.NRO_MESA?.toString().replace(/[A-Za-z]/g, '').replace(/^0+/, '') || '0';
    
    return {
        dni: parseInt(row.DOCUMENTO),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        genero: mapearGenero(row.SEXO),
        domicilio: row.DOMICILIO?.trim(),
        numero_mesa: parseInt(mesaLimpia) || null,
        numero_orden: parseInt(row.ORDEN),
        nacionalidad: 'Extranjera',
        isExtranjero: true
    };
}

/**
 * Inserta un ciudadano en la base de datos
 */
async function insertarCiudadano(ciudadanoData) {
    try {
        // Obtener ID de mesa
        const mesaId = await getMesaId(ciudadanoData.numero_mesa, ciudadanoData.isExtranjero);
        
        if (!mesaId) {
            log.warning(`Saltando ciudadano ${ciudadanoData.dni} - Mesa ${ciudadanoData.numero_mesa} no encontrada`);
            return false;
        }
        
        // Verificar si ya existe
        const existente = await Ciudadano.findOne({ where: { dni: ciudadanoData.dni } });
        if (existente) {
            // Solo mostrar algunos duplicados para no spam
            if (stats.duplicates < 10) {
                log.warning(`Ciudadano con DNI ${ciudadanoData.dni} ya existe`);
            }
            stats.duplicates++;
            return false;
        }
        
        // Crear ciudadano con retry automático
        await createWithRetry({
            mesa_id: mesaId,
            nombre: ciudadanoData.nombre,
            apellido: ciudadanoData.apellido,
            dni: ciudadanoData.dni,
            genero: ciudadanoData.genero,
            domicilio: ciudadanoData.domicilio,
            numero_orden: ciudadanoData.numero_orden,
            nacionalidad: ciudadanoData.nacionalidad,
            voto: false,
            status: 'active'
        });
        
        stats.inserted++;
        return true;
        
    } catch (error) {
        log.error(`Error insertando ciudadano ${ciudadanoData.dni}: ${error.message}`);
        stats.errors++;
        return false;
    }
}

/**
 * Crear ciudadano con reintentos automáticos en caso de error de conexión
 */
async function createWithRetry(ciudadanoData, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await Ciudadano.create(ciudadanoData);
            return;
        } catch (error) {
            if (error.message.includes('Connection terminated') || 
                error.message.includes('Connection lost') ||
                error.message.includes('ECONNRESET')) {
                
                log.warning(`Error de conexión, reintentando ${i + 1}/${maxRetries}...`);
                
                // Esperar antes de reintentar
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                
                // Reconectar a la base de datos
                try {
                    await sequelize.authenticate();
                } catch (reconnectError) {
                    log.warning(`Error reconectando: ${reconnectError.message}`);
                }
                
                if (i === maxRetries - 1) throw error; // Último intento
            } else {
                throw error; // Error no relacionado con conexión
            }
        }
    }
}

/**
 * Procesa un archivo CSV
 */
function procesarCSV(filePath, parsearFuncion, descripcion) {
    return new Promise((resolve, reject) => {
        const ciudadanos = [];
        let count = 0;
        
        log.info(`Iniciando procesamiento: ${descripcion}`);
        log.info(`Archivo: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`Archivo no encontrado: ${filePath}`));
        }
        
        fs.createReadStream(filePath, { encoding: 'latin1' }) // Usar latin1 para caracteres especiales
            .pipe(csv({ 
                separator: ';',
                quote: '',  // Sin comillas de quote
                escape: '', // Sin caracteres de escape
                strict: false,  // Permitir registros con formato no estricto
                skipEmptyLines: true,
                skipLinesWithError: true,  // Saltear líneas con errores de parsing
                maxRowBytes: 10000  // Aumentar límite de bytes por fila
            }))
            .on('data', (row) => {
                count++;
                
                // Mostrar progreso cada 10k líneas
                if (count % 10000 === 0) {
                    log.info(`📖 Leyendo línea ${count}...`);
                }
                
                if (CONFIG.TEST_MODE && count > CONFIG.MAX_TEST_RECORDS) {
                    return; // Saltear registros adicionales en modo test
                }
                
                try {
                    const ciudadano = parsearFuncion(row);
                    if (ciudadano.dni && ciudadano.numero_mesa) {
                        ciudadanos.push(ciudadano);
                    } else {
                        // Solo mostrar primer warning de cada tipo para no spam
                        if (count <= 5 || count % 1000 === 0) {
                            log.warning(`Registro inválido en línea ${count}: DNI o Mesa faltante`);
                        }
                    }
                } catch (error) {
                    // Solo mostrar primeros errores para no spam
                    if (count <= 10) {
                        log.error(`Error parseando línea ${count}: ${error.message}`);
                    }
                }
            })
            .on('end', () => {
                log.info(`✅ CSV leído: ${ciudadanos.length} registros válidos de ${count} líneas totales`);
                log.info(`📊 Registros en modo TEST: ${CONFIG.TEST_MODE ? 'SÍ' : 'NO'} (máximo: ${CONFIG.MAX_TEST_RECORDS})`);
                resolve(ciudadanos);
            })
            .on('error', (error) => {
                log.error(`Error leyendo CSV en línea ${count}: ${error.message}`);
                // No rechazar completamente, continuar con lo que se pudo leer
                log.warning(`Continuando con ${ciudadanos.length} registros leídos hasta el error...`);
                resolve(ciudadanos);
            });
    });
}

/**
 * Procesa ciudadanos en lotes
 */
async function procesarEnLotes(ciudadanos, descripcion) {
    log.info(`Procesando ${ciudadanos.length} ${descripcion} en lotes de ${CONFIG.BATCH_SIZE}`);
    
    for (let i = 0; i < ciudadanos.length; i += CONFIG.BATCH_SIZE) {
        const lote = ciudadanos.slice(i, i + CONFIG.BATCH_SIZE);
        log.info(`Procesando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1}/${Math.ceil(ciudadanos.length/CONFIG.BATCH_SIZE)} (${lote.length} registros)`);
        
        for (const ciudadano of lote) {
            stats.processed++;
            await insertarCiudadano(ciudadano);
            
            // Mostrar progreso cada 50 registros
            if (stats.processed % 50 === 0) {
                log.info(`Progreso: ${stats.processed} procesados, ${stats.inserted} insertados`);
            }
        }
    }
}

/**
 * Función principal
 */
async function main() {
    const startTime = Date.now();
    
    log.info('🚀 Iniciando importación de ciudadanos');
    log.info(`Modo: ${CONFIG.TEST_MODE ? 'PRUEBA (máximo 1 registro)' : 'COMPLETO'}`);
    
    try {
        // Conectar a la base de datos
        log.info('Conectando a la base de datos...');
        await sequelize.authenticate();
        log.success('Conexión a base de datos exitosa');
        
        // Precargar cache de mesas
        log.info('Cargando mesas en cache...');
        const mesas = await Mesa.findAll({ attributes: ['id', 'numero', 'mesa_extranjeros'] });
        log.success(`${mesas.length} mesas cargadas en cache`);
        
        // Procesar ciudadanos nacionales
        if (fs.existsSync(CONFIG.CSV_FILES.NACIONALES)) {
            log.info('📋 Procesando ciudadanos nacionales...');
            const ciudadanosNacionales = await procesarCSV(
                CONFIG.CSV_FILES.NACIONALES, 
                parsearCiudadanoNacional,
                'Ciudadanos Nacionales'
            );
            
            if (ciudadanosNacionales.length > 0) {
                await procesarEnLotes(ciudadanosNacionales, 'ciudadanos nacionales');
            }
        } else {
            log.warning('Archivo de ciudadanos nacionales no encontrado');
        }
        
        // Procesar ciudadanos extranjeros (solo si no es modo test o si ya terminamos nacionales)
        if (!CONFIG.TEST_MODE || stats.inserted === 0) {
            if (fs.existsSync(CONFIG.CSV_FILES.EXTRANJEROS)) {
                log.info('🌍 Procesando ciudadanos extranjeros...');
                const ciudadanosExtranjeros = await procesarCSV(
                    CONFIG.CSV_FILES.EXTRANJEROS,
                    parsearCiudadanoExtranjero,
                    'Ciudadanos Extranjeros'
                );
                
                if (ciudadanosExtranjeros.length > 0) {
                    await procesarEnLotes(ciudadanosExtranjeros, 'ciudadanos extranjeros');
                }
            } else {
                log.warning('Archivo de ciudadanos extranjeros no encontrado');
            }
        }
        
    } catch (error) {
        log.error(`Error en importación: ${error.message}`);
        console.error(error.stack);
    } finally {
        // Cerrar conexión
        await sequelize.close();
        
        // Mostrar estadísticas finales
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        log.info('\n📊 ESTADÍSTICAS FINALES:');
        log.info(`⏱️  Tiempo total: ${duration}s`);
        log.info(`📝 Registros procesados: ${stats.processed}`);
        log.info(`✅ Ciudadanos insertados: ${stats.inserted}`);
        log.info(`❌ Errores: ${stats.errors}`);
        log.info(`⚠️  Mesas no encontradas: ${stats.mesasNotFound}`);
        log.info(`🔄 Duplicados saltados: ${stats.duplicates}`);
        
        if (CONFIG.TEST_MODE) {
            log.info('\n🧪 MODO PRUEBA COMPLETADO');
            log.info('Si todo se ve bien, ejecuta sin --test para importación completa');
        } else {
            log.info('\n🎉 IMPORTACIÓN COMPLETA FINALIZADA');
        }
    }
}

// Ejecutar script
if (require.main === module) {
    main().catch(console.error);
}
