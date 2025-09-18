# SelectWrapper

Un componente wrapper reutilizable para `react-select` que proporciona una interfaz consistente y personalizable para todos los selects de la aplicación.

## Características

- ✅ **Reutilizable**: Un solo componente para todos los selects
- ✅ **Personalizable**: Temas y estilos personalizables
- ✅ **Accesible**: Soporte para labels, ayuda y manejo de errores
- ✅ **Responsivo**: Adaptable a diferentes tamaños de pantalla
- ✅ **Tema oscuro**: Soporte automático para modo oscuro
- ✅ **TypeScript**: Tipado completo con PropTypes
- ✅ **Performance**: Optimizado con useMemo y useCallback
- ✅ **API Integration**: Carga de opciones desde APIs externas
- ✅ **Smart Loading**: Precarga automática cuando isSearchable es false

## Instalación

```bash
npm install react-select
```

## Uso Básico

```jsx
import SelectWrapper from '../components/SelectWrapper';

const MyComponent = () => {
    const [selectedOption, setSelectedOption] = useState(null);
    
    const options = [
        { value: 'option1', label: 'Opción 1' },
        { value: 'option2', label: 'Opción 2' },
        { value: 'option3', label: 'Opción 3' }
    ];
    
    return (
        <SelectWrapper
            options={options}
            value={selectedOption}
            onChange={setSelectedOption}
            placeholder="Selecciona una opción"
            label="Mi Select"
        />
    );
};
```

## Props

### Props Básicos

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `Array` | `[]` | Array de opciones para el select |
| `value` | `Object\|Array` | - | Valor seleccionado |
| `onChange` | `Function` | - | Función llamada cuando cambia la selección |
| `placeholder` | `String` | `'Seleccionar...'` | Texto del placeholder |
| `isDisabled` | `Boolean` | `false` | Si el select está deshabilitado |
| `isLoading` | `Boolean` | `false` | Si está cargando opciones |

### Props de Selección

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isMulti` | `Boolean` | `false` | Si permite selección múltiple |
| `isClearable` | `Boolean` | `true` | Si permite limpiar la selección |
| `isSearchable` | `Boolean` | `true` | Si permite buscar en las opciones |

### Props de Búsqueda

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onInputChange` | `Function` | - | Función llamada cuando cambia el input |
| `filterOption` | `Function` | - | Función personalizada para filtrar opciones |
| `noOptionsMessage` | `Function\|String` | `'No hay opciones disponibles'` | Mensaje cuando no hay opciones |

### Props de Carga por API

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `loadOptions` | `Function` | - | Función que retorna una promesa con las opciones desde API |
| `loadAllOnMount` | `Boolean` | `false` | Si cargar todas las opciones al montar el componente |
| `defaultOptions` | `Array` | `[]` | Opciones por defecto mientras se cargan las de la API |

### Props de Estilo

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `String` | `''` | Clase CSS adicional |
| `customStyles` | `Object` | `{}` | Estilos personalizados para react-select |
| `theme` | `String` | `'default'` | Tema del select (`'default'` o `'minimal'`) |

### Props Avanzados

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `closeMenuOnSelect` | `Boolean` | `true` | Si cerrar el menú al seleccionar |
| `blurInputOnSelect` | `Boolean` | `true` | Si hacer blur del input al seleccionar |
| `captureMenuScroll` | `Boolean` | `true` | Si capturar el scroll del menú |
| `hideSelectedOptions` | `Boolean` | `false` | Si ocultar opciones ya seleccionadas |

### Props de Callbacks

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onBlur` | `Function` | - | Función llamada al perder el foco |
| `onFocus` | `Function` | - | Función llamada al obtener el foco |
| `onMenuOpen` | `Function` | - | Función llamada al abrir el menú |
| `onMenuClose` | `Function` | - | Función llamada al cerrar el menú |

### Props de Componentes Personalizados

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `components` | `Object` | `{}` | Componentes personalizados de react-select |

### Props de Manejo de Errores

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `hasError` | `Boolean` | `false` | Si el select tiene un error |
| `errorMessage` | `String` | `''` | Mensaje de error a mostrar |

### Props de UI

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `String` | - | Label del select |
| `helpText` | `String` | - | Texto de ayuda |
| `required` | `Boolean` | `false` | Si el campo es requerido |

## Ejemplos de Uso

### Select Simple

```jsx
<SelectWrapper
    options={[
        { value: 'admin', label: 'Administrador' },
        { value: 'user', label: 'Usuario' },
        { value: 'guest', label: 'Invitado' }
    ]}
    value={selectedRole}
    onChange={setSelectedRole}
    label="Rol de Usuario"
    required
/>
```

### Select Múltiple

```jsx
<SelectWrapper
    options={cities}
    value={selectedCities}
    onChange={setSelectedCities}
    isMulti
    label="Ciudades"
    placeholder="Selecciona ciudades..."
    helpText="Puedes seleccionar múltiples ciudades"
/>
```

### Select con Búsqueda Remota

```jsx
<SelectWrapper
    options={users}
    value={selectedUser}
    onChange={setSelectedUser}
    onInputChange={handleSearch}
    label="Buscar Usuario"
    placeholder="Escribe para buscar..."
    isLoading={isSearching}
/>
```

### Select con Carga por API (Búsqueda)

```jsx
const loadUsers = async (inputValue) => {
    const response = await fetch(`/api/users?search=${inputValue}`);
    const users = await response.json();
    return users.map(user => ({
        value: user.id,
        label: user.name
    }));
};

<SelectWrapper
    options={[]}
    value={selectedUser}
    onChange={setSelectedUser}
    loadOptions={loadUsers}
    isSearchable={true}
    label="Buscar Usuario"
    placeholder="Escribe para buscar..."
/>
```

### Select con Carga por API (Sin Búsqueda - Precarga Todo)

```jsx
const loadAllUsers = async (inputValue, { action }) => {
    if (action === 'load-all') {
        // Cargar TODAS las opciones sin límite
        const response = await fetch('/api/users/all');
        const users = await response.json();
        return users.map(user => ({
            value: user.id,
            label: user.name
        }));
    }
    
    // Búsqueda normal
    if (inputValue) {
        const response = await fetch(`/api/users?search=${inputValue}`);
        const users = await response.json();
        return users.map(user => ({
            value: user.id,
            label: user.name
        }));
    }
    
    return [];
};

<SelectWrapper
    options={[]}
    value={selectedUser}
    onChange={setSelectedUser}
    loadOptions={loadAllUsers}
    isSearchable={false}
    loadAllOnMount={true}
    defaultOptions={[
        { value: 'default1', label: 'Usuario por Defecto 1' },
        { value: 'default2', label: 'Usuario por Defecto 2' }
    ]}
    label="Seleccionar Usuario"
    placeholder="Selecciona un usuario..."
    helpText="Se precargan todas las opciones sin límite"
/>
```

### Select con Tema Minimal

```jsx
<SelectWrapper
    options={options}
    value={value}
    onChange={onChange}
    theme="minimal"
    label="Select Minimal"
/>
```

### Select con Estilos Personalizados

```jsx
const customStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: '#f8f9fa',
        borderColor: state.isFocused ? '#007bff' : '#dee2e6',
        borderRadius: '20px',
        padding: '8px 16px'
    })
};

<SelectWrapper
    options={options}
    value={value}
    onChange={onChange}
    customStyles={customStyles}
    label="Select Personalizado"
/>
```

### Select con Manejo de Errores

```jsx
<SelectWrapper
    options={options}
    value={value}
    onChange={onChange}
    label="Campo Requerido"
    required
    hasError={!!error}
    errorMessage={error}
/>
```

## Funcionalidad de Carga por API

### Comportamiento Inteligente

El componente `SelectWrapper` ahora incluye funcionalidad avanzada para cargar opciones desde APIs externas:

#### Cuando `isSearchable={true}` (Comportamiento de Búsqueda)
- Las opciones se cargan al escribir en el input
- Se puede implementar búsqueda con debounce
- Ideal para grandes conjuntos de datos

#### Cuando `isSearchable={false}` (Comportamiento de Precarga)
- **Se precargan TODAS las opciones sin límite**
- Las opciones se cargan al abrir el menú o hacer click
- Se puede usar `loadAllOnMount={true}` para carga inmediata
- Perfecto para listas completas de opciones

### Función `loadOptions`

La función `loadOptions` debe retornar una promesa y recibir dos parámetros:

```javascript
const loadOptions = async (inputValue, { action }) => {
    // inputValue: El texto del input de búsqueda
    // action: Meta información de la acción (ej: 'load-all', 'input-change')
    
    if (action === 'load-all') {
        // Cargar todas las opciones sin límite
        const response = await fetch('/api/items/all');
        return response.json();
    }
    
    // Búsqueda normal
    if (inputValue) {
        const response = await fetch(`/api/items?search=${inputValue}`);
        return response.json();
    }
    
    return [];
};
```

### Props de Control de Carga

- **`loadOptions`**: Función que retorna una promesa con las opciones
- **`loadAllOnMount`**: Si cargar opciones inmediatamente al montar
- **`defaultOptions`**: Opciones por defecto mientras se cargan las de la API

### Casos de Uso Comunes

1. **Lista de Usuarios Completa**: `isSearchable={false}` + `loadAllOnMount={true}`
2. **Búsqueda de Productos**: `isSearchable={true}` + búsqueda con debounce
3. **Selector de Países**: `isSearchable={false}` + carga al abrir menú
4. **Búsqueda de Empleados**: `isSearchable={true}` + filtrado por departamento

## Estructura de Opciones

Las opciones deben seguir este formato:

```javascript
const options = [
    { value: 'unique_id', label: 'Texto Visible' },
    { value: 'another_id', label: 'Otra Opción' }
];
```

Para selects múltiples, el valor puede ser:

```javascript
// Opción única
const singleValue = { value: 'id', label: 'Texto' };

// Múltiples opciones
const multipleValues = [
    { value: 'id1', label: 'Texto 1' },
    { value: 'id2', label: 'Texto 2' }
];
```

## Temas Disponibles

### Default
- Bordes redondeados
- Sombras en focus
- Colores estándar

### Minimal
- Sin bordes laterales
- Solo borde inferior
- Diseño más limpio

## Personalización de Estilos

Puedes personalizar cualquier parte del select usando la prop `customStyles`:

```javascript
const customStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
        borderColor: state.isFocused ? '#2196f3' : '#e0e0e0'
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#2196f3' : 'transparent',
        color: state.isSelected ? 'white' : '#333'
    })
};
```

## Accesibilidad

El componente incluye:

- Labels asociados correctamente
- Indicadores de campos requeridos
- Mensajes de error claros
- Soporte para navegación por teclado
- Textos de ayuda descriptivos

## Responsividad

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Altura estándar (38px)
- **Mobile**: Altura reducida (36px)
- **Espaciado**: Ajustado según el dispositivo

## Soporte para Tema Oscuro

El componente detecta automáticamente la preferencia de tema del sistema y ajusta los colores:

- **Claro**: Colores estándar
- **Oscuro**: Colores adaptados para modo oscuro

## Performance

El componente está optimizado con:

- `useMemo` para estilos
- `useCallback` para handlers
- Re-renders mínimos
- Lazy loading de opciones
- Carga inteligente según `isSearchable`

## Troubleshooting

### Problemas Comunes

1. **El select no se renderiza**
   - Verifica que `react-select` esté instalado
   - Asegúrate de que las opciones sean un array

2. **Los estilos no se aplican**
   - Verifica que el CSS esté importado
   - Usa `customStyles` para sobrescribir estilos

3. **El onChange no funciona**
   - Verifica que la función esté definida
   - Asegúrate de que el valor tenga el formato correcto

4. **Las opciones de la API no se cargan**
   - Verifica que `loadOptions` retorne una promesa
   - Asegúrate de que la función maneje el caso `action === 'load-all'`
   - Verifica que `isSearchable` esté configurado correctamente

### Debug

```jsx
<SelectWrapper
    options={options}
    value={value}
    onChange={(newValue) => {
        console.log('Nuevo valor:', newValue);
        setValue(newValue);
    }}
    onInputChange={(inputValue, actionMeta) => {
        console.log('Input change:', inputValue, actionMeta);
    }}
    loadOptions={async (inputValue, meta) => {
        console.log('Loading options:', inputValue, meta);
        const options = await fetchOptions(inputValue);
        console.log('Loaded options:', options);
        return options;
    }}
/>
```

## Contribución

Para contribuir al componente:

1. Mantén la consistencia con el diseño actual
2. Agrega tests para nuevas funcionalidades
3. Documenta nuevos props y ejemplos
4. Sigue las convenciones de nomenclatura

## Licencia

Este componente es parte del proyecto Fisca Web React.
