# Implementación del Sistema de Jerarquía de Roles

## Descripción General

Este documento describe la implementación del sistema de jerarquía de roles que controla qué usuarios pueden crear otros usuarios basándose en su posición en la jerarquía organizacional.

## Jerarquía de Roles

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

## Implementación Técnica

### 1. Middleware de Validación (`middleware/roleHierarchy.js`)

El middleware `validateRoleHierarchy` se encarga de:

- Validar que el usuario autenticado puede crear el rol especificado
- Verificar la jerarquía de roles antes de permitir la creación
- Retornar errores apropiados si la validación falla

#### Funciones Principales:

- `validateRoleHierarchy(req, res, next)`: Middleware principal de validación
- `getAvailableRolesForCreation(roleName)`: Obtiene roles disponibles para creación
- `canCreateRole(currentRole, targetRole)`: Verifica si un rol puede crear otro

### 2. Endpoint de Creación de Usuarios

El endpoint `POST /api/admin/users` ahora incluye:

- **Validación de jerarquía**: Solo permite crear usuarios con roles por debajo del usuario actual
- **Campo `created_by`**: Automáticamente asigna el ID del usuario que está creando la cuenta
- **Middleware de validación**: `validateRoleHierarchy` se ejecuta antes de la creación

### 3. Endpoint de Roles Disponibles

Nuevo endpoint `GET /api/admin/users/available-roles` que:

- Retorna solo los roles que el usuario actual puede crear
- Filtra basándose en la jerarquía de roles
- Es útil para el frontend para mostrar opciones válidas

## Uso del Sistema

### En el Backend

```javascript
// Aplicar el middleware en las rutas
router.post('/', hasPermission('users.create'), validateRoleHierarchy, async (req, res) => {
  // El middleware ya validó la jerarquía
  // req.user.id está disponible para created_by
});

// Obtener roles disponibles
router.get('/available-roles', async (req, res) => {
  const availableRoles = getAvailableRolesForCreation(req.user.role.name);
});
```

### En el Frontend

```javascript
// Obtener roles disponibles para el usuario actual
const { data: availableRoles } = await usersService.getAvailableRoles();

// Usar solo los roles permitidos en el formulario de creación
const roleOptions = availableRoles.map(role => ({
  value: role.id,
  label: role.display_name
}));
```

## Configuración de Roles

### Estructura de la Base de Datos

Los roles deben tener los siguientes nombres en la base de datos:

- `admin`
- `jefe_campana`
- `responsable_localidad`
- `responsable_seccion`
- `responsable_circuito`
- `fiscal_general`
- `fiscal_mesa`
- `logistica`

### Campos Requeridos

- `name`: Nombre interno del rol (usado para la jerarquía)
- `display_name`: Nombre mostrado al usuario
- `status`: Estado del rol (`active` o `inactive`)

## Seguridad

### Validaciones Implementadas

1. **Autenticación**: Usuario debe estar logueado
2. **Permisos**: Usuario debe tener permiso `users.create`
3. **Jerarquía**: Solo puede crear roles por debajo de su nivel
4. **Auditoría**: Se registra quién creó cada usuario (`created_by`)

### Prevención de Escalación de Privilegios

- Los usuarios no pueden crear cuentas con roles superiores o iguales
- La validación se realiza en el backend antes de la creación
- El frontend solo muestra opciones válidas

## Casos de Uso

### Escenario 1: Jefe de Campaña crea Responsable de Localidad
✅ **Permitido**: El rol está por debajo en la jerarquía

### Escenario 2: Responsable de Localidad intenta crear Jefe de Campaña
❌ **Bloqueado**: El rol está por encima en la jerarquía

### Escenario 3: Fiscal de Mesa intenta crear cualquier usuario
❌ **Bloqueado**: No tiene permisos para crear usuarios

### Escenario 4: Admin crea cualquier rol
✅ **Permitido**: Admin tiene acceso completo

## Mantenimiento

### Agregar Nuevos Roles

1. Agregar el rol a la base de datos
2. Actualizar `ROLE_HIERARCHY` en `middleware/roleHierarchy.js`
3. Definir qué roles puede crear el nuevo rol

### Modificar Jerarquía

1. Editar el objeto `ROLE_HIERARCHY`
2. Probar con el script de pruebas
3. Actualizar documentación

## Testing

El sistema incluye funciones de prueba que pueden ejecutarse para verificar:

- Validación de jerarquía
- Permisos de creación
- Roles disponibles por usuario

## Consideraciones Futuras

- **Auditoría**: Logs detallados de creación de usuarios
- **Notificaciones**: Alertas cuando se crean usuarios
- **Aprobación**: Sistema de aprobación para ciertos roles
- **Temporal**: Roles con expiración automática
