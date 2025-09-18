# Importación de Datos de San Fernando

Este script importa datos de los archivos CSV `SF.csv` y `SFE.csv` a la base de datos del sistema Fisca Web React.

## Estructura de Datos

### Mapeo de Columnas CSV a Modelos de Base de Datos

- **DISTRITO** → `Localidad.nombre`
- **ESTABLECIMIENTO** → `Escuela.nombre` (clave única)
- **DOMICILIO** → `Escuela.calle`
- **CIRCUITO ELECTORAL** → `Circuito.nombre`
- **MD** (Mesa Desde) → Rango inicial de mesas
- **MH** (Mesa Hasta) → Rango final de mesas

### Entidades Creadas

1. **Localidad**: SAN FERNANDO
2. **Circuito**: Circuitos electorales (872, 873, 874, etc.)
3. **Escuela**: Establecimientos educativos
4. **Mesa**: Mesas electorales (rango desde MD hasta MH)

## Instalación

```bash
# Instalar dependencias
npm install

# O si prefieres yarn
yarn install
```

## Uso

### Ejecutar Importación

```bash
# Usando npm
npm run import

# Usando yarn
yarn import

# O directamente
node import_san_fernando.js
```

### Scripts Disponibles

- `npm run import` - Ejecuta la importación completa
- `npm start` - Alias para la importación

## Funcionalidades

### Limpieza de Base de Datos
- Elimina todas las localidades existentes
- Elimina todos los circuitos existentes
- Elimina todas las escuelas existentes
- Elimina todas las mesas existentes
- Elimina usuarios (excepto admin)
- Elimina todos los UserAccess

### Importación Inteligente
- Crea la localidad "SAN FERNANDO" si no existe
- Crea circuitos únicos basados en la columna "CIRCUITO ELECTORAL"
- Crea o actualiza escuelas usando "ESTABLECIMIENTO" como clave única
- Genera mesas en el rango especificado (MD a MH)
- Evita duplicados en ejecuciones múltiples

### Manejo de Errores
- Logging detallado de cada operación
- Continuación del proceso aunque falle un registro individual
- Resumen final con conteos de entidades creadas

## Archivos CSV

### SF.csv
- Contiene 64 registros de escuelas principales
- Circuitos: 872, 873, 874, 875, 876, 877, 878, 0878A, 879, 0879A, 880, 0880A, 0880B, 882, 0882A

### SFE.csv
- Contiene 7 registros de escuelas especiales
- Circuitos: 872, 0878A, 0879A

## Estructura de Relaciones

```
Localidad (SAN FERNANDO)
└── Circuito (872, 873, 874, etc.)
    └── Escuela (Establecimiento)
        └── Mesa (MD a MH)
```

## Notas Importantes

- El script puede ejecutarse múltiples veces sin duplicar datos
- Las escuelas se actualizan si ya existen (basándose en el nombre)
- Las mesas se recrean completamente en cada ejecución
- Se preserva el usuario admin (role_id = 1)
- El script cierra la conexión a la base de datos al finalizar

## Logs de Ejecución

El script proporciona logs detallados con emojis para facilitar el seguimiento:
- 🚀 Inicio del proceso
- 🧹 Limpieza de datos
- ✅ Operaciones exitosas
- ❌ Errores encontrados
- 📊 Estadísticas de archivos
- 📈 Resumen final
- 🎉 Completado exitosamente
