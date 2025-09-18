# Affiliate Members System

## Overview

El sistema de miembros de affiliates permite establecer relaciones jerárquicas entre affiliates con permisos específicos. Cada affiliate puede tener otros affiliates como miembros, con control granular sobre qué contenido pueden usar, copiar, asignar o acceder.

## Database Schema

### Tabla `affiliate_members`

```sql
CREATE TABLE affiliate_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_affiliate_id INTEGER NOT NULL,
    to_affiliate_id INTEGER NOT NULL,
    can_use BOOLEAN DEFAULT FALSE,
    can_copy BOOLEAN DEFAULT FALSE,
    can_assign BOOLEAN DEFAULT FALSE,
    access_publishers BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (to_affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    UNIQUE(from_affiliate_id, to_affiliate_id)
);
```

### Relaciones

- `from_affiliate_id`: El affiliate que posee la relación (Affiliate A)
- `to_affiliate_id`: El affiliate que es miembro (Affiliate B)

## Permisos

### 1. `can_use` - B puede usar contenido de A
- Permite que el affiliate B use contenido del affiliate A
- Aplica a páginas, historias, módulos, etc.

### 2. `can_copy` - B puede copiar contenido de A
- Permite que el affiliate B copie contenido del affiliate A
- Permite duplicar elementos completos

### 3. `can_assign` - B puede asignar contenido a A
- Permite que el affiliate B asigne contenido al affiliate A
- Controla la dirección de asignación

### 4. `access_publishers` - Acceso a publishers de A para B
- Permite que los publishers del affiliate B accedan al affiliate A
- Controla acceso a funcionalidades de publisher

## API Endpoints

### GET `/api/admin/affiliates/:id/members`
Obtiene la lista de miembros de un affiliate.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "from_affiliate_id": 1,
      "to_affiliate_id": 2,
      "can_use": true,
      "can_copy": false,
      "can_assign": false,
      "access_publishers": true,
      "toAffiliate": {
        "id": 2,
        "name": "Affiliate B",
        "slug": "affiliate-b"
      }
    }
  ]
}
```

### GET `/api/admin/affiliates/:id/available-members`
Obtiene la lista de affiliates disponibles para agregar como miembros.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Affiliate C",
      "slug": "affiliate-c"
    }
  ]
}
```

### POST `/api/admin/affiliates/:id/members`
Agrega un nuevo miembro al affiliate.

**Request:**
```json
{
  "to_affiliate_id": 2,
  "permissions": {
    "can_use": true,
    "can_copy": false,
    "can_assign": false,
    "access_publishers": true
  }
}
```

### PUT `/api/admin/affiliates/:id/members/:member_id`
Actualiza los permisos de un miembro.

**Request:**
```json
{
  "permissions": {
    "can_use": true,
    "can_copy": true,
    "can_assign": false,
    "access_publishers": false
  }
}
```

### DELETE `/api/admin/affiliates/:id/members/:member_id`
Elimina un miembro del affiliate.

## Frontend Implementation

### Componente `AffiliateMembers`

El componente maneja la interfaz de usuario para gestionar miembros:

```jsx
<AffiliateMembers
    affiliateId={affiliateId}
    members={members}
    availableMembers={availableMembers}
    onAddMember={addMember}
    onUpdatePermissions={updateMemberPermissions}
    onRemoveMember={removeMember}
    permissionOptions={permissionOptions}
/>
```

### Funcionalidades

1. **Agregar Miembros**: Selector de affiliates disponibles
2. **Gestionar Permisos**: Checkboxes para cada permiso
3. **Eliminar Miembros**: Botón de eliminación por miembro
4. **Validación**: Prevención de relaciones duplicadas

## Service Methods

### `affiliatesService.getMembers(affiliateId)`
Obtiene la lista de miembros de un affiliate.

### `affiliatesService.getAvailableMembers(affiliateId)`
Obtiene affiliates disponibles para agregar como miembros.

### `affiliatesService.addMember(affiliateId, toAffiliateId, permissions)`
Agrega un nuevo miembro con permisos específicos.

### `affiliatesService.updateMemberPermissions(affiliateId, memberId, permissions)`
Actualiza los permisos de un miembro existente.

### `affiliatesService.removeMember(affiliateId, memberId)`
Elimina un miembro del affiliate.

## Model Methods

### `Affiliate.prototype.getMembers()`
Obtiene todos los miembros del affiliate.

### `Affiliate.prototype.addMember(toAffiliateId, permissions)`
Agrega un miembro con permisos específicos.

### `Affiliate.prototype.updateMemberPermissions(toAffiliateId, permissions)`
Actualiza los permisos de un miembro.

### `Affiliate.prototype.removeMember(toAffiliateId)`
Elimina un miembro.

### `Affiliate.prototype.hasMember(toAffiliateId)`
Verifica si un affiliate es miembro.

### `Affiliate.prototype.getMemberPermissions(toAffiliateId)`
Obtiene los permisos de un miembro específico.

## Casos de Uso

### Ejemplo 1: Affiliate A tiene como miembro a Affiliate B
- A puede ver y gestionar B como miembro
- B puede usar contenido de A (si `can_use = true`)
- B puede copiar contenido de A (si `can_copy = true`)
- B puede asignar contenido a A (si `can_assign = true`)
- Los publishers de B pueden acceder a A (si `access_publishers = true`)

### Ejemplo 2: Jerarquía Compleja
```
Affiliate A (Principal)
├── Affiliate B (Miembro)
│   ├── Affiliate D (Miembro de B)
│   └── Affiliate E (Miembro de B)
└── Affiliate C (Miembro)
    └── Affiliate F (Miembro de C)
```

## Seguridad

1. **Validación de Usuario**: Solo usuarios asociados al affiliate pueden gestionar miembros
2. **Prevención de Ciclos**: No se permiten relaciones circulares
3. **Permisos Granulares**: Control específico por tipo de permiso
4. **Auditoría**: Todas las operaciones se registran con timestamps

## Consideraciones de Performance

1. **Índices**: La tabla tiene índices en todas las columnas de búsqueda
2. **Caché**: Los permisos se pueden cachear para consultas frecuentes
3. **Paginación**: Las listas de miembros soportan paginación
4. **Lazy Loading**: Los miembros se cargan solo cuando se edita un affiliate

## Extensibilidad

El sistema está diseñado para ser extensible:

1. **Nuevos Permisos**: Fácil agregar nuevos tipos de permisos
2. **Jerarquías Complejas**: Soporte para múltiples niveles
3. **Integración**: Se integra con el sistema de permisos existente
4. **APIs**: Endpoints RESTful para integración externa 