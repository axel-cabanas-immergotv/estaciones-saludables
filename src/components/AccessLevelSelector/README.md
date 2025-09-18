# AccessLevelSelector

Este componente permite seleccionar niveles de acceso para usuarios basándose en su rol y permisos actuales.

## Características

- **Integración con SelectWrapper**: Utiliza el componente `SelectWrapper` para una mejor experiencia de usuario
- **Búsqueda en tiempo real**: Conectado a la API REST para búsquedas dinámicas
- **Jerarquía de roles**: Respeta la jerarquía de roles del sistema
- **Filtrado por permisos**: Solo muestra opciones que el usuario puede asignar
- **Selección múltiple**: Permite seleccionar múltiples entidades por nivel

## Uso

```jsx
import AccessLevelSelector from './components/AccessLevelSelector';

<AccessLevelSelector
    value={selectedAccessLevels}
    onChange={handleAccessLevelChange}
    userRole={currentUserRole}
    currentUserAccess={currentUserAccess}
    disabled={false}
/>
```

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `value` | `Array` | Array de niveles de acceso seleccionados |
| `onChange` | `Function` | Función llamada cuando cambian los niveles |
| `userRole` | `Object` | Rol del usuario actual |
| `currentUserAccess` | `Array` | Niveles de acceso del usuario actual |
| `disabled` | `Boolean` | Si el selector está deshabilitado |

## Estructura de Datos

### Valor del Componente
```javascript
[
    {
        entity_type: 'localidades', // Tipo de entidad
        entity_id: 1,               // ID de la entidad
        entity_name: 'Buenos Aires', // Nombre de la entidad
        parent_id: null              // ID de la entidad padre
    }
]
```

### Niveles de Acceso
- **localidades**: Ciudades o regiones
- **circuitos**: Distritos electorales
- **escuelas**: Centros de votación
- **mesas**: Mesas de votación

## Jerarquía de Roles

| Rol | Niveles Asignables |
|-----|-------------------|
| `admin` | Todos los niveles |
| `jefe_campana` | Todos los niveles |
| `responsable_localidad` | circuitos, escuelas, mesas |
| `responsable_seccion` | circuitos, escuelas, mesas |
| `responsable_circuito` | escuelas, mesas |
| `fiscal_general` | mesas |
| `fiscal_mesa` | Ninguno |
| `logistica` | Ninguno |

## Integración con API REST

El componente se conecta automáticamente a los siguientes endpoints:

- `/api/admin/localidades` - Para buscar localidades
- `/api/admin/circuitos` - Para buscar circuitos
- `/api/admin/escuelas` - Para buscar escuelas
- `/api/admin/mesas` - Para buscar mesas

### Búsqueda Remota

- **Trigger**: Al escribir en el campo de búsqueda
- **Delay**: Mínimo 2 caracteres
- **Filtrado**: Basado en los permisos del usuario actual
- **Cache**: Las opciones se almacenan localmente para mejor rendimiento

## Estilos CSS

El componente incluye estilos personalizados para integrarse con `SelectWrapper`:

```css
.access-level-selector__select-wrapper {
    width: 100%;
}

.access-level-selector__select-wrapper .select-wrapper {
    width: 100%;
}
```

## Ejemplo de Implementación

```jsx
import React, { useState } from 'react';
import AccessLevelSelector from './AccessLevelSelector';

const UserAccessEditor = () => {
    const [accessLevels, setAccessLevels] = useState([]);
    
    const handleAccessChange = (newLevels) => {
        setAccessLevels(newLevels);
        console.log('Niveles de acceso actualizados:', newLevels);
    };
    
    return (
        <div>
            <h2>Editor de Niveles de Acceso</h2>
            <AccessLevelSelector
                value={accessLevels}
                onChange={handleAccessChange}
                userRole={{ name: 'admin' }}
                currentUserAccess={[
                    { localidad_id: 1, circuito_id: 5, escuela_id: 10 }
                ]}
            />
        </div>
    );
};
```

## Dependencias

- `react` - Framework base
- `../SelectWrapper` - Componente de selección mejorado
- `./accessLevelSelector.css` - Estilos del componente

## Notas de Implementación

- El componente maneja automáticamente la conversión entre el formato interno y el formato esperado por `SelectWrapper`
- La búsqueda remota se optimiza para evitar llamadas innecesarias a la API
- Se mantiene la compatibilidad con la estructura de datos existente
- Los estilos están diseñados para integrarse perfectamente con el sistema de diseño existente
