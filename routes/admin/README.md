# Admin API Endpoints

This document describes all the REST API endpoints available in the admin section.

## Authentication

All admin routes require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL

All endpoints are prefixed with `/api/admin`

## Entity Endpoints

### Localidades

#### GET /localidades
List all localidades with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for nombre
- `ids` (optional): Comma-separated list of specific IDs

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

#### GET /localidades/:id
Get a specific localidad with its circuitos.

#### POST /localidades
Create a new localidad.

**Required Fields:**
- `nombre`: String

#### PUT /localidades/:id
Update an existing localidad.

#### DELETE /localidades/:id
Delete a localidad (only if no circuitos are associated).

#### GET /localidades/:id/circuitos
Get all circuitos for a specific localidad.

### Circuitos

#### GET /circuitos
List all circuitos with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for nombre
- `ids` (optional): Comma-separated list of specific IDs
- `localidad_id` (optional): Filter by localidad
- `circuito_id` (optional): Filter by circuito

#### GET /circuitos/:id
Get a specific circuito with its localidad and escuelas.

#### POST /circuitos
Create a new circuito.

**Required Fields:**
- `nombre`: String
- `localidad_id`: Integer (must reference existing localidad)

#### PUT /circuitos/:id
Update an existing circuito.

#### DELETE /circuitos/:id
Delete a circuito (only if no escuelas are associated).

#### GET /circuitos/:id/escuelas
Get all escuelas for a specific circuito.

### Escuelas

#### GET /escuelas
List all escuelas with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for nombre or calle
- `ids` (optional): Comma-separated list of specific IDs
- `circuito_id` (optional): Filter by circuito
- `localidad_id` (optional): Filter by localidad (through circuito)

#### GET /escuelas/:id
Get a specific escuela with its circuito, localidad, and mesas.

#### POST /escuelas
Create a new escuela.

**Required Fields:**
- `nombre`: String
- `circuito_id`: Integer (must reference existing circuito)

**Optional Fields:**
- `calle`: String
- `altura`: String
- `lat`: Decimal (latitude)
- `lon`: Decimal (longitude)
- `dificultad`: String
- `abierto`: Boolean

#### PUT /escuelas/:id
Update an existing escuela.

#### DELETE /escuelas/:id
Delete a escuela (only if no mesas are associated).

#### GET /escuelas/:id/mesas
Get all mesas for a specific escuela.

### Mesas

#### GET /mesas
List all mesas with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for numero
- `ids` (optional): Comma-separated list of specific IDs
- `escuela_id` (optional): Filter by escuela
- `circuito_id` (optional): Filter by circuito (through escuela)
- `localidad_id` (optional): Filter by localidad (through circuito and escuela)

#### GET /mesas/:id
Get a specific mesa with its escuela, circuito, localidad, and ciudadanos.

#### POST /mesas
Create a new mesa.

**Required Fields:**
- `numero`: Integer
- `escuela_id`: Integer (must reference existing escuela)

**Optional Fields:**
- `mesa_testigo`: Boolean
- `mesa_extranjeros`: Boolean
- `mesa_abrio`: Boolean

**Validation:**
- Mesa number must be unique within the escuela

#### PUT /mesas/:id
Update an existing mesa.

#### DELETE /mesas/:id
Delete a mesa (only if no ciudadanos are associated).

#### GET /mesas/:id/ciudadanos
Get all ciudadanos for a specific mesa.

### Ciudadanos

#### GET /ciudadanos
List all ciudadanos with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for nombre, apellido, dni, domicilio, or numero_orden
- `ids` (optional): Comma-separated list of specific IDs
- `mesa_id` (optional): Filter by mesa
- `mesa_numero` (optional): Filter by mesa number
- `escuela_id` (optional): Filter by escuela (through mesa)
- `circuito_id` (optional): Filter by circuito (through escuela and mesa)
- `localidad_id` (optional): Filter by localidad (through circuito, escuela and mesa)
- `voto` (optional): Filter by vote status (true/false)

#### GET /ciudadanos/:id
Get a specific ciudadano with its mesa, escuela, circuito, and localidad.

#### POST /ciudadanos
Create a new ciudadano.

**Required Fields:**
- `nombre`: String
- `apellido`: String
- `dni`: BigInt (must be unique)
- `mesa_id`: Integer (must reference existing mesa)

**Optional Fields:**
- `nacionalidad`: String
- `genero`: Enum ('masculino', 'femenino', 'otro')
- `domicilio`: String
- `codigo_postal`: String
- `numero_orden`: Integer

**Validation:**
- DNI must be unique across all ciudadanos

#### PUT /ciudadanos/:id
Update an existing ciudadano.

#### DELETE /ciudadanos/:id
Delete a ciudadano.

#### GET /ciudadanos/search/dni/:dni
Search for a ciudadano by DNI with full hierarchy information.

## Common Response Format

All endpoints return responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## Error Codes

- `400`: Bad Request (validation errors, missing required fields)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (entity not found)
- `500`: Internal Server Error

## Permissions Required

Each endpoint requires specific permissions:

- `localidades.read`, `localidades.create`, `localidades.update`, `localidades.delete`
- `circuitos.read`, `circuitos.create`, `circuitos.update`, `circuitos.delete`
- `escuelas.read`, `escuelas.create`, `escuelas.update`, `escuelas.delete`
- `mesas.read`, `mesas.create`, `mesas.update`, `mesas.delete`
- `ciudadanos.read`, `ciudadanos.create`, `ciudadanos.update`, `ciudadanos.delete`

## Data Relationships

The entities follow a hierarchical structure:

```
Localidad → Circuito → Escuela → Mesa → Ciudadano
```

- Each circuito belongs to one localidad
- Each escuela belongs to one circuito
- Each mesa belongs to one escuela
- Each ciudadano belongs to one mesa

When deleting entities, the system checks for dependent entities and prevents deletion if any exist. 