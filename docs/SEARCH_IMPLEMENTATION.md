# Sistema de Búsqueda Case-Insensitive y Sin Acentos

## Descripción

Se ha implementado un sistema de búsqueda unificado que permite realizar búsquedas sin importar mayúsculas/minúsculas ni acentos en todas las entidades del sistema.

## Características

- **Case-insensitive**: No importa si se escribe en mayúsculas o minúsculas
- **Compatible con PostgreSQL**: Usa `ILIKE` nativo para búsquedas case-insensitive
- **Alternativa con normalización**: Función adicional que normaliza texto para casos especiales
- **Unificado**: Todas las entidades usan la misma lógica de búsqueda
- **Robusto**: Maneja casos edge como búsquedas vacías o nulas

## Implementación

### Archivo de Utilidades

El archivo `utils/searchUtils.js` contiene las funciones principales:

```javascript
const { createSearchCondition } = require('../../utils/searchUtils');

// Uso básico
if (search) {
  Object.assign(whereClause, createSearchCondition(search, ['nombre']));
}
```

### Función `createSearchCondition` (Recomendada)

```javascript
createSearchCondition(searchTerm, fields)
```

**Parámetros:**
- `searchTerm`: El término de búsqueda
- `fields`: Array de nombres de campos donde buscar

**Retorna:**
- Objeto con la cláusula WHERE de Sequelize usando `ILIKE`
- Objeto vacío si no hay término de búsqueda

**Características:**
- Usa `ILIKE` nativo de PostgreSQL para búsquedas case-insensitive
- Mantiene acentos y caracteres especiales
- Máximo rendimiento en PostgreSQL

### Función `createSearchConditionLike` (Alternativa)

```javascript
createSearchConditionLike(searchTerm, fields)
```

**Parámetros:**
- `searchTerm`: El término de búsqueda
- `fields`: Array de nombres de campos donde buscar

**Retorna:**
- Objeto con la cláusula WHERE de Sequelize usando `LIKE`
- Normaliza el texto de búsqueda (remueve acentos, convierte a minúsculas)

**Uso:**
- Para casos donde se necesita normalización de texto
- Compatible con todas las bases de datos
- Útil para búsquedas que deben ignorar acentos

### Función `normalizeText`

```javascript
normalizeText(text)
```

**Parámetros:**
- `text`: Texto a normalizar

**Retorna:**
- Texto normalizado (sin acentos, en minúsculas)

## Entidades Actualizadas

Las siguientes entidades han sido actualizadas para usar el nuevo sistema:

### 1. Localidades
- **Campos de búsqueda**: `nombre`
- **Archivo**: `routes/admin/localidades.js`

### 2. Circuitos
- **Campos de búsqueda**: `nombre`
- **Archivo**: `routes/admin/circuitos.js`

### 3. Ciudadanos
- **Campos de búsqueda**: `nombre`, `apellido`, `dni`, `domicilio`
- **Archivo**: `routes/admin/ciudadanos.js`

### 4. Escuelas
- **Campos de búsqueda**: `nombre`, `calle`
- **Archivo**: `routes/admin/escuelas.js`

### 5. Mesas
- **Campos de búsqueda**: `numero`
- **Archivo**: `routes/admin/mesas.js`

### 6. Permisos
- **Campos de búsqueda**: `name`, `entity`, `action`
- **Archivo**: `routes/admin/permissions.js`

### 7. Afiliados
- **Campos de búsqueda**: `name`, `slug`, `description`
- **Archivo**: `routes/admin/affiliates.js`

### 8. Roles
- **Campos de búsqueda**: `name`, `display_name`
- **Archivo**: `routes/admin/roles.js`

### 9. Usuarios
- **Campos de búsqueda**: `first_name`, `last_name`, `email`, `dni`, `telefono`
- **Archivo**: `routes/admin/users.js`

## Ejemplos de Uso

### Búsqueda Simple
```javascript
// Antes
if (search) {
  whereClause[Op.or] = [
    { nombre: { [Op.like]: `%${search}%` } }
  ];
}

// Después
if (search) {
  Object.assign(whereClause, createSearchCondition(search, ['nombre']));
}
```

### Búsqueda Múltiple
```javascript
// Antes
if (search) {
  whereClause[Op.or] = [
    { nombre: { [Op.like]: `%${search}%` } },
    { apellido: { [Op.like]: `%${search}%` } },
    { dni: { [Op.like]: `%${search}%` } }
  ];
}

// Después
if (search) {
  Object.assign(whereClause, createSearchCondition(search, ['nombre', 'apellido', 'dni']));
}
```

## Casos de Prueba

### Con `createSearchCondition` (ILIKE - Recomendado)
- **"México"** → busca "México", "mexico", "MEXICO" (case-insensitive)
- **"Córdoba"** → busca "Córdoba", "cordoba", "CORDOBA" (case-insensitive)
- **"SAN JUAN"** → busca "San Juan", "san juan", "SAN JUAN" (case-insensitive)

### Con `createSearchConditionLike` (LIKE + Normalización)
- **"México"** → busca "mexico" (normalizado)
- **"Córdoba"** → busca "cordoba" (normalizado)
- **"SAN JUAN"** → busca "san juan" (normalizado)

## Ventajas

1. **Consistencia**: Todas las entidades usan la misma lógica
2. **Mantenibilidad**: Cambios en la lógica de búsqueda se aplican en un solo lugar
3. **Experiencia de usuario**: Búsquedas más intuitivas y flexibles
4. **Rendimiento**: Optimizado para diferentes tipos de base de datos
5. **Escalabilidad**: Fácil agregar nuevas entidades al sistema

## Consideraciones Técnicas

- **PostgreSQL**: Usa `ILIKE` nativo para búsquedas case-insensitive
- **Compatibilidad**: Función alternativa con `LIKE` para otras bases de datos
- **Normalización**: Función opcional que remueve acentos usando Unicode
- **Operadores**: Usa strings (`$or`, `$iLike`, `$like`) para mejor compatibilidad
- **Manejo de errores**: Retorna objeto vacío para búsquedas inválidas

## Próximos Pasos

Para agregar búsqueda a una nueva entidad:

1. Importar la función utilitaria
2. Reemplazar la lógica de búsqueda existente
3. Especificar los campos de búsqueda
4. Probar con diferentes tipos de texto

## Archivos Modificados

- `utils/searchUtils.js` (nuevo)
- `routes/admin/localidades.js`
- `routes/admin/circuitos.js`
- `routes/admin/ciudadanos.js`
- `routes/admin/escuelas.js`
- `routes/admin/mesas.js`
- `routes/admin/permissions.js`
- `routes/admin/affiliates.js`
- `routes/admin/roles.js`
- `routes/admin/users.js`
