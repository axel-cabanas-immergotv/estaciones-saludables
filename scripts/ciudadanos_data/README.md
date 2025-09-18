# Importación de Ciudadanos

Scripts para importar datos de ciudadanos desde archivos CSV a la base de datos.

## Archivos Requeridos

Los siguientes archivos CSV deben estar en esta carpeta:

- `SAN FERNANDO.csv` - Ciudadanos nacionales/argentinos
- `SAN FERNANDO EXTRANJEROS.csv` - Ciudadanos extranjeros

## Estructura de los CSV

### SAN FERNANDO.csv (Ciudadanos Argentinos)
```
DOCUMENTO;SEXO;APELLIDO;NOMBRE;CLASE;DOMICILIO;PROFESION;DISTRITO;COD_CIRC;NRO_MESA;ORDEN
10000582;M;BALMACEDA;ALBERTO MAGNO;1951;ISLAS-S/C S/N;JORNALERO;105;00882;0397;35
```

### SAN FERNANDO EXTRANJEROS.csv (Ciudadanos Extranjeros)
```
DOCUMENTO;SEXO;APELLIDO Y NOMBRE;CLASE;DOMICILIO;PROFESION;DISTRITO;COD_CIRC;NRO_MESA;ORDEN
94497518;F;ABAD CUEVA LIDA MERCEDES;1977;gandolfo 2178;NULL;105;00872;9001;1
```

## Instalación

1. Instalar dependencias:
```bash
cd scripts/ciudadanos_data
npm install
```

2. Verificar configuración:
```bash
npm run debug
```

## Uso

### 1. Modo Prueba (Recomendado primero)

Importa solo **1 ciudadano** para verificar que todo funciona correctamente:

```bash
npm run test
```

Este comando:
- ✅ Procesa solo 1 registro del primer archivo
- ✅ Valida conexión a base de datos
- ✅ Verifica mapeo de mesas
- ✅ Muestra estadísticas detalladas

### 2. Importación Completa

Una vez verificado que el modo prueba funciona correctamente:

```bash
npm run import
```

Este comando:
- 📋 Procesa todos los registros de ambos archivos CSV
- 🚀 Importa en lotes para mejor rendimiento
- 📊 Muestra progreso y estadísticas en tiempo real

## Características del Script

### 🔍 Validaciones
- Verifica existencia de archivos CSV
- Valida formato de datos (DNI, número de mesa, etc.)
- Detecta y salta duplicados por DNI
- Maneja registros con datos faltantes

### 🗺️ Mapeo Automático
- **Número de mesa → ID de mesa**: Busca automáticamente en la base de datos
- **Sexo**: M → masculino, F → femenino
- **Mesa extranjeros**: Diferencia automáticamente ciudadanos nacionales vs extranjeros
- **Nombres separados**: Para extranjeros, separa "APELLIDO Y NOMBRE" en campos individuales

### 📊 Estadísticas
- Registros procesados
- Ciudadanos insertados exitosamente
- Errores encontrados
- Mesas no encontradas
- Duplicados saltados

### 🚀 Optimizaciones
- **Cache de mesas**: Evita consultas repetidas
- **Procesamiento en lotes**: Mejora rendimiento
- **Codificación latin1**: Maneja caracteres especiales correctamente

## Estructura de Datos Mapeados

Los datos del CSV se mapean a la tabla `ciudadanos` así:

| CSV | Base de Datos | Notas |
|-----|---------------|-------|
| `DOCUMENTO` | `dni` | Convertido a entero |
| `APELLIDO` / `APELLIDO Y NOMBRE` | `apellido`, `nombre` | Separados automáticamente para extranjeros |
| `SEXO` | `genero` | M→masculino, F→femenino |
| `DOMICILIO` | `domicilio` | Texto limpio |
| `NRO_MESA` | `mesa_id` | **Mapeado automáticamente al ID de la mesa** |
| `ORDEN` | `numero_orden` | Posición en la mesa |
| - | `nacionalidad` | "Argentina" o "Extranjera" según archivo |
| - | `voto` | Siempre `false` inicialmente |
| - | `status` | Siempre `'active'` |

## Manejo de Errores

### Mesas no encontradas
Si un número de mesa del CSV no existe en la base de datos:
- ⚠️ Se registra un warning
- 📊 Se cuenta en estadísticas
- ⏭️ Se salta el ciudadano (no se inserta)

### Ciudadanos duplicados
Si un DNI ya existe:
- ⚠️ Se registra un warning
- 📊 Se cuenta como duplicado
- ⏭️ Se salta la inserción

### Datos inválidos
Si faltan datos críticos (DNI, número de mesa):
- ⚠️ Se registra un warning
- ⏭️ Se salta el registro

## Ejemplo de Salida

```
🚀 Iniciando importación de ciudadanos
Modo: PRUEBA (máximo 1 registro)
ℹ️  Conectando a la base de datos...
✅ Conexión a base de datos exitosa
✅ 1247 mesas cargadas en cache
📋 Procesando ciudadanos nacionales...
ℹ️  Archivo: /path/to/SAN FERNANDO.csv
✅ CSV leído: 1 registros válidos de 1 líneas
ℹ️  Procesando 1 ciudadanos nacionales en lotes de 100
✅ Ciudadano insertado correctamente

📊 ESTADÍSTICAS FINALES:
⏱️  Tiempo total: 3s
📝 Registros procesados: 1
✅ Ciudadanos insertados: 1
❌ Errores: 0
⚠️  Mesas no encontradas: 0
🔄 Duplicados saltados: 0

🧪 MODO PRUEBA COMPLETADO
Si todo se ve bien, ejecuta sin --test para importación completa
```

## Resolución de Problemas

### Error: "Mesa no encontrada"
- Verificar que las mesas estén correctamente importadas en la base de datos
- Revisar que los números de mesa en el CSV coincidan con los de la base de datos

### Error: "Archivo no encontrado"
- Verificar que los archivos CSV estén en la carpeta correcta
- Verificar nombres de archivos exactos (case-sensitive)

### Error: "Conexión a base de datos"
- Verificar variables de entorno en `.env`
- Ejecutar `npm run debug` para diagnóstico completo

## Comandos Útiles

```bash
# Verificar configuración completa
npm run debug

# Modo prueba (1 registro)
npm run test

# Importación completa
npm run import

# Ver ayuda
node import_ciudadanos.js --help
```
