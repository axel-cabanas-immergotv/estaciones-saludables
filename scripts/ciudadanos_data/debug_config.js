// Debug script to check database configuration and CSV files
console.log('🔍 Debugging ciudadanos import configuration...\n');

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../../.env' });

console.log('📋 Environment Variables:');
console.log(`   DATABASE: ${process.env.DATABASE}`);
console.log(`   POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
console.log(`   POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
console.log(`   POSTGRES_DB: ${process.env.POSTGRES_DB}`);
console.log(`   POSTGRES_USER: ${process.env.POSTGRES_USER}`);
console.log(`   POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***SET***' : 'NOT SET'}`);

// Check CSV files
console.log('\n📁 CSV Files:');
const csvFiles = [
    { name: 'SAN FERNANDO.csv', path: path.join(__dirname, 'SAN FERNANDO.csv') },
    { name: 'SAN FERNANDO EXTRANJEROS.csv', path: path.join(__dirname, 'SAN FERNANDO EXTRANJEROS.csv') }
];

csvFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
        const stats = fs.statSync(file.path);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   ✅ ${file.name} - ${fileSizeInMB} MB`);
    } else {
        console.log(`   ❌ ${file.name} - NOT FOUND`);
    }
});

async function testConnection() {
    console.log('\n🔧 Testing database connection...');
    
    try {
        const { sequelize, Mesa, Ciudadano } = require('../../models');
        
        console.log('✅ Models loaded successfully');
        
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test models
        console.log('\n📊 Testing models...');
        
        // Count existing mesas
        const mesaCount = await Mesa.count();
        console.log(`   📋 Total mesas en DB: ${mesaCount}`);
        
        // Count existing ciudadanos
        const ciudadanoCount = await Ciudadano.count();
        console.log(`   👥 Total ciudadanos en DB: ${ciudadanoCount}`);
        
        // Sample mesas data
        const sampleMesas = await Mesa.findAll({ 
            limit: 5, 
            attributes: ['id', 'numero', 'mesa_extranjeros'],
            order: [['numero', 'ASC']]
        });
        
        console.log('\n📋 Sample mesas:');
        sampleMesas.forEach(mesa => {
            console.log(`   Mesa ${mesa.numero} (ID: ${mesa.id}) - Extranjeros: ${mesa.mesa_extranjeros}`);
        });
        
        // Check for specific mesa numbers from CSV
        console.log('\n🔍 Checking sample mesa numbers from CSV...');
        const testMesaNumbers = [397, 150, 162, 219, 9001]; // From CSV samples
        
        for (const numero of testMesaNumbers) {
            const mesa = await Mesa.findOne({ where: { numero } });
            if (mesa) {
                console.log(`   ✅ Mesa ${numero} found (ID: ${mesa.id}, Extranjeros: ${mesa.mesa_extranjeros})`);
            } else {
                console.log(`   ❌ Mesa ${numero} NOT found`);
            }
        }
        
        await sequelize.close();
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// CSV Preview function
function previewCSV() {
    console.log('\n📖 CSV Preview:');
    
    csvFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
            console.log(`\n--- ${file.name} ---`);
            const content = fs.readFileSync(file.path, 'latin1');
            const lines = content.split('\n').slice(0, 3); // First 3 lines
            lines.forEach((line, index) => {
                if (line.trim()) {
                    console.log(`   ${index + 1}: ${line.trim()}`);
                }
            });
        }
    });
}

// Run all tests
async function runAllTests() {
    await testConnection();
    previewCSV();
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Run test import: npm run test');
    console.log('   2. If test is successful, run full import: npm run import');
}

runAllTests();
