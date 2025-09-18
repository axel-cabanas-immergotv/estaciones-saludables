# Migraciones del Sistema Fisca

Este directorio contiene las migraciones de base de datos para el sistema Fisca.

## Migración Inicial (001_initial_setup.js)

Esta migración configura el sistema inicial con:

### 1. Roles del Sistema
- **Admin**: Acceso completo a todo el sistema
- **Jefe de Campaña**: Puede leer todo y crear usuarios con roles inferiores
- **Responsable de Localidad**: Puede crear usuarios con roles inferiores
- **Responsable de Sección**: Puede crear usuarios con roles inferiores
- **Responsable de Circuito**: Puede crear usuarios con roles inferiores
- **Fiscal General**: Puede crear usuarios con roles inferiores
- **Fiscal de Mesa**: Solo permisos de lectura básicos
- **Logística**: Solo permisos de lectura básicos

### 2. Permisos del Sistema
Se crean permisos CRUD para todas las entidades:
- Users, Affiliates, Localidades, Secciones, Circuitos, Escuelas, Mesas, Ciudadanos, Roles, Permissions

### 3. Usuario Administrador
- **Email**: admin@fisca.com
- **Password**: 123456
- **Rol**: Admin (acceso completo)

### 4. Affiliate Inicial
- **Nombre**: LLA
- **Slug**: lla
- **Descripción**: Affiliate inicial del sistema

## Cómo Ejecutar

### Opción 1: Script Personalizado (Recomendado)
```bash
# Migración normal
node migrations/run-migration.js

# Clean restart (elimina todas las tablas)
node migrations/run-migration.js --clean

# Sync force después de migración
node migrations/run-migration.js --sync

# Clean restart + sync force
node migrations/run-migration.js --clean --sync

# Revertir migración
node migrations/run-migration.js --down
```

### Opción 2: Variables de Entorno (Solo para configuración de base de datos)
```bash
# Solo para configurar la conexión a la base de datos
export DATABASE=postgres
export POSTGRES_HOST=localhost
export POSTGRES_DB=fisca_dev
node migrations/run-migration.js --clean --sync
```

### Opción 3: Sequelize CLI
```bash
# Migración normal
npx sequelize-cli db:migrate

# Revertir migración
npx sequelize-cli db:migrate:undo
```

### Opción 4: Manual desde Node.js
```bash
# Migración normal
node -e "
const { sequelize } = require('./models');
const migration = require('./migrations/001_initial_setup');
migration.up(sequelize.getQueryInterface(), sequelize);
"
```

## Estructura de Permisos

### Jerarquía de Roles y Permisos de Creación

```
Admin (acceso completo)
├── Jefe de Campaña
│   ✅ Puede crear usuarios con roles:
│   ├── Responsable de Localidad
│   ├── Responsable de Sección
│   ├── Responsable de Circuito
│   ├── Fiscal General
│   ├── Fiscal de Mesa
│   └── Logística
├── Responsable de Localidad
│   ✅ Puede crear usuarios con roles:
│   ├── Responsable de Sección
│   ├── Responsable de Circuito
│   ├── Fiscal General
│   ├── Fiscal de Mesa
│   └── Logística
├── Responsable de Sección
│   ✅ Puede crear usuarios con roles:
│   ├── Responsable de Circuito
│   ├── Fiscal General
│   ├── Fiscal de Mesa
│   └── Logística
├── Responsable de Circuito
│   ✅ Puede crear usuarios con roles:
│   ├── Fiscal General
│   ├── Fiscal de Mesa
│   └── Logística
├── Fiscal General
│   ✅ Puede crear usuarios con roles:
│   ├── Fiscal de Mesa
│   └── Logística
├── Fiscal de Mesa (solo lectura)
└── Logística (solo lectura)
```

**Nota importante**: Cada rol solo puede crear usuarios con roles que estén por debajo en la jerarquía. Por ejemplo:
- **Fiscal General** NO puede crear usuarios con rol "Responsable de Circuito"
- **Responsable de Circuito** NO puede crear usuarios con rol "Responsable de Sección"
- Solo **Admin** puede crear usuarios con cualquier rol

### Implementación Técnica de la Jerarquía

La jerarquía se implementa mediante **permisos específicos** que controlan qué roles puede crear cada nivel:

```javascript
// Ejemplo: Fiscal General solo puede crear estos roles:
const fiscalGeneralPermissions = createdPermissions.filter(p => 
  p.action === 'read' || 
  p.name === 'users.create' ||
  p.name === 'users.create.fiscal_mesa' ||      // ✅ Puede crear Fiscal de Mesa
  p.name === 'users.create.logistica'           // ✅ Puede crear Logística
);
// ❌ NO tiene permisos para crear usuarios con roles superiores
```

**Permisos de jerarquía creados:**
- `users.create.responsable_localidad` - Solo para Jefe de Campaña
- `users.create.responsable_seccion` - Para Jefe de Campaña y Responsable de Localidad
- `users.create.responsable_circuito` - Para Jefe de Campaña, Responsable de Localidad y Responsable de Sección
- `users.create.fiscal_general` - Para Jefe de Campaña, Responsable de Localidad, Responsable de Sección y Responsable de Circuito
- `users.create.fiscal_mesa` - Para todos excepto Fiscal de Mesa y Logística
- `users.create.logistica` - Para todos excepto Fiscal de Mesa y Logística

### Permisos por Entidad
Cada entidad tiene permisos CRUD:
- **create**: Crear nuevos registros
- **read**: Leer registros existentes
- **update**: Modificar registros existentes
- **delete**: Eliminar registros

## Notas Importantes

- Todos los roles y permisos se marcan como `is_system: true` para evitar su eliminación accidental
- El usuario admin se asocia automáticamente con el affiliate LLA
- La migración usa transacciones para garantizar consistencia de datos
- Incluye función de rollback completa para revertir todos los cambios

## Dependencias

- `dotenv`: Para cargar variables de entorno
- `bcryptjs`: Para el hash de contraseñas
- `sequelize`: ORM de base de datos
- Base de datos configurada según `models/index.js`

## Variables de Entorno Requeridas

Asegúrate de tener un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Base de datos
DATABASE=sqlite  # o postgres
SQLITE_STORAGE=./database.sqlite

# Para PostgreSQL (si usas DATABASE=postgres)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fisca_dev
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password

# Entorno
NODE_ENV=development

# Opciones de migración (solo por argumentos de línea de comandos)
# No se requieren variables de entorno para clean restart y sync force
```

## Opciones de Migración

### Clean Restart
La migración puede limpiar completamente la base de datos antes de ejecutarse:

```bash
# Solo por argumentos de línea de comandos
node migrations/run-migration.js --clean
```

**¿Qué hace CLEAN_RESTART?**
- 🗑️ Elimina todas las tablas de usuario existentes
- 🔗 Elimina todas las constraints y foreign keys
- 🔄 **Resetea todas las secuencias** (IDs empiezan desde 1)
- 🧹 Deja la base de datos completamente limpia
- 🛡️ **Preserva tablas del sistema** (spatial_ref_sys, geography_columns, etc.)
- ⚠️ **ATENCIÓN**: Esto elimina TODOS los datos de usuario existentes

### Sync Force
Después de la migración, puede hacer un sync force de Sequelize:

```bash
# Solo por argumentos de línea de comandos
node migrations/run-migration.js --sync
```

**¿Qué hace SYNC_FORCE?**
- 🔄 Sincroniza todos los modelos con la base de datos
- 🆕 Crea las tablas exactamente como están definidas en los modelos
- 🎯 Útil para asegurar que la estructura de la DB coincida con los modelos
- ⚡ **Se ejecuta ANTES de la migración** cuando se usa con --clean
- 🔒 **Se ejecuta DESPUÉS de la migración** cuando se usa sin --clean

## Casos de Uso Comunes

### 🆕 **Primera Instalación**
```bash
# Clean restart + sync force para empezar desde cero
node migrations/run-migration.js --clean --sync
```

### 🔄 **Reiniciar Sistema**
```bash
# Cuando quieres limpiar todo y empezar de nuevo
node migrations/run-migration.js --clean
```

### 🛠️ **Desarrollo/Testing**
```bash
# Para asegurar que la DB coincida con los modelos
node migrations/run-migration.js --sync
```

### 🚀 **Producción**
```bash
# Solo migración, sin limpiar ni hacer sync
node migrations/run-migration.js
```

## 🌱 **Script de Seed**

### **¿Qué es el Seed?**
El script `seed.js` genera datos de prueba realistas para todas las entidades del sistema, incluyendo:
- 📍 **Localidades**: San Fernando, Vicente López, San Isidro, Tigre, Malvinas Argentinas
- 🔢 **Secciones**: 5 secciones numeradas
- 🔄 **Circuitos**: 2-3 circuitos por localidad
- 🏫 **Escuelas**: 3-5 escuelas por circuito con coordenadas reales
- 🪑 **Mesas**: 5-8 mesas por escuela (testigo, extranjeros, etc.)
- 👥 **Ciudadanos**: 200-300 ciudadanos por mesa con DNIs únicos
- 👤 **Usuarios de prueba**: 3 de cada rol (Responsable de Localidad, Fiscal General, Fiscal de Mesa)

### **Cómo Usar el Seed**

#### **Seed Básico (solo datos)**
```bash
node migrations/seed.js
```

#### **Seed con Limpieza**
```bash
# Limpia datos existentes antes de crear nuevos
node migrations/seed.js --clean
```

**¿Qué hace --clean?**
- 🗑️ **TRUNCATE CASCADE** en PostgreSQL (más rápido que DELETE)
- 🔄 **Resetea secuencias** para que los IDs empiecen desde 1
- ✅ **Verifica** que las tablas estén completamente vacías
- 🛡️ **Preserva** usuarios, roles, permisos y affiliates

#### **Seed Completo (Clean + Sync + Seed)**
```bash
# Limpia todo, sincroniza modelos y crea datos
node migrations/seed.js --clean --sync
```

### **Credenciales de Usuarios de Prueba**

#### **Responsable de Localidad**
- `responsable.localidad1@fisca.com` / `123456`
- `responsable.localidad2@fisca.com` / `123456`
- `responsable.localidad3@fisca.com` / `123456`

#### **Fiscal General**
- `fiscal.general1@fisca.com` / `123456`
- `fiscal.general2@fisca.com` / `123456`
- `fiscal.general3@fisca.com` / `123456`

#### **Fiscal de Mesa**
- `fiscal.mesa1@fisca.com` / `123456`
- `fiscal.mesa2@fisca.com` / `123456`
- `fiscal.mesa3@fisca.com` / `123456`

## ⚠️ **Advertencias Importantes**

- **--clean**: Elimina TODOS los datos existentes. Úsalo solo en desarrollo/testing
- **--sync**: Recrea las tablas. Puede perder datos si hay inconsistencias
- **Producción**: Siempre usa solo la migración normal sin opciones adicionales
- **Backup**: Siempre haz backup antes de usar --clean en bases de datos con datos importantes
- **Seguridad**: Las opciones destructivas solo se activan por argumentos explícitos de línea de comandos

## 🔄 **Flujo de Trabajo Recomendado**

### **🆕 Primera Instalación Completa**
```bash
# 1. Migración inicial con clean restart
node migrations/run-migration.js --clean --sync

# 2. Seed de datos de prueba
node migrations/seed.js
```

### **🔄 Reinicio Completo del Sistema**
```bash
# 1. Clean restart + sync force
node migrations/run-migration.js --clean --sync

# 2. Seed de datos
node migrations/seed.js
```

### **🌱 Solo Datos de Prueba**
```bash
# Si ya tienes la estructura, solo agrega datos
node migrations/seed.js --clean
```

### **🛠️ Desarrollo/Testing**
```bash
# Para testing, puedes usar el seed completo
node migrations/seed.js --clean --sync
```

## 🔄 **Reseteo de Secuencias (PostgreSQL)**

### **¿Qué son las Secuencias?**
Las secuencias en PostgreSQL son objetos que generan números autoincrementales para los campos `id` de las tablas. Por ejemplo:
- `users_id_seq` para la tabla `users`
- `roles_id_seq` para la tabla `roles`
- `permissions_id_seq` para la tabla `permissions`

### **¿Por Qué Resetearlas?**
- **Después de clean restart**: Las secuencias mantienen su último valor aunque las tablas se eliminen
- **IDs consecutivos**: Garantiza que los nuevos registros empiecen desde ID = 1
- **Consistencia**: Evita gaps grandes en los IDs después de múltiples ciclos de limpieza

### **¿Cómo Funciona?**
1. 🧹 **Clean restart** elimina todas las tablas
2. 🔄 **Reset sequences** ejecuta `ALTER SEQUENCE ... RESTART WITH 1` en todas las secuencias
3. 🆕 **Sync force** crea las tablas con secuencias reseteadas
4. 📝 **Migración** inserta datos que empiezan desde ID = 1

## 🔄 **Orden de Ejecución**

### **Con --clean --sync**
1. 🧹 **Clean restart**: Elimina todas las tablas
2. 🔄 **Sync force**: Crea las tablas según los modelos
3. 📝 **Migración**: Inserta los datos iniciales

### **Solo con --sync (sin --clean)**
1. 📝 **Migración**: Inserta los datos iniciales
2. 🔄 **Sync force**: Sincroniza modelos con la base de datos

### **Solo con --clean (sin --sync)**
1. 🧹 **Clean restart**: Elimina todas las tablas
2. 📝 **Migración**: Inserta los datos iniciales (crea tablas si no existen)

## 🔧 **Estrategias de Clean Restart por Base de Datos**

### **PostgreSQL**
- ✅ **Estrategia principal**: Drop en lote con CASCADE
- ✅ **Fallback**: Drop individual con CASCADE
- ✅ **Último recurso**: Drop sin CASCADE
- 🔄 **Reseteo de secuencias**: Todas las secuencias vuelven a empezar desde 1
- 🛡️ **Preserva**: Tablas del sistema (spatial_ref_sys, etc.)
- 🔒 **Sin permisos especiales**: No requiere `session_replication_role`

### **MySQL**
- ✅ **Estrategia**: Deshabilita temporalmente foreign key checks
- ✅ **Drop**: Todas las tablas con `force: true`
- ✅ **Re-enable**: Foreign key checks después de la limpieza

### **SQLite**
- ✅ **Estrategia**: Drop estándar con `force: true`
- ✅ **Simple**: Sin manejo especial de foreign keys
