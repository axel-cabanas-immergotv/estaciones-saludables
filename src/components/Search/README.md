# Search Component

Un componente genérico y reutilizable para funcionalidades de búsqueda y filtros.

## Características

- ✅ Campo de búsqueda con placeholder personalizable
- ✅ Botones de búsqueda y limpiar con iconos
- ✅ Filtros dinámicos mediante selectores
- ✅ Layout responsive y personalizable
- ✅ Soporte para eventos de teclado (Enter para buscar)
- ✅ Estilos CSS modulares
- ✅ Opciones de renderizado (con/sin tarjeta)
- ✅ Control de búsqueda automática vs manual
- ✅ Optimizado para reducir requests innecesarios

## Comportamiento de Búsqueda

El componente ofrece dos modos de búsqueda:

### 1. Búsqueda Manual (Recomendado)
**`autoSearch={false}` (por defecto)**
- La búsqueda se ejecuta SOLO al:
  - Hacer clic en el botón de búsqueda
  - Presionar Enter en el campo de búsqueda
- Evita múltiples requests mientras se escribe
- Ideal para búsquedas costosas o bases de datos grandes

### 2. Búsqueda Automática (Legacy)
**`autoSearch={true}`**
- La búsqueda se ejecuta automáticamente mientras se escribe
- Compatible con implementaciones existentes
- Útil para búsquedas rápidas en datos pequeños

## Uso Básico

```jsx
import Search from '../Search';

const MyComponent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    
    const handleSearchChange = (term) => {
        setSearchTerm(term); // Solo actualizar UI
    };
    
    const handleSearchExecute = (term, filters) => {
        // Ejecutar búsqueda real (solo al hacer clic o Enter)
        console.log('Ejecutando búsqueda:', term, filters);
        // Aquí va la lógica de búsqueda real
    };
    
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const filterOptions = [
        {
            field: 'category',
            label: 'Categoría',
            placeholder: 'Todas las categorías',
            options: [
                { value: 'tech', label: 'Tecnología' },
                { value: 'design', label: 'Diseño' }
            ]
        }
    ];
    
    return (
        <Search
            enableSearch={true}
            searchTerm={searchTerm}
            searchPlaceholder="Buscar productos..."
            onSearchChange={handleSearchChange}
            onSearchExecute={handleSearchExecute}
            filterOptions={filterOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
            autoSearch={false} // Búsqueda solo al hacer clic o Enter
        />
    );
};
```

## Props

### Props de Búsqueda

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `enableSearch` | boolean | `false` | Habilita el campo de búsqueda |
| `searchTerm` | string | `''` | Valor actual del término de búsqueda |
| `searchPlaceholder` | string | `'Buscar...'` | Placeholder del campo de búsqueda |
| `onSearchChange` | function | `null` | Callback para cambios en el término de búsqueda (solo actualiza UI) |
| `onSearchExecute` | function | `null` | Callback para ejecutar búsqueda (al hacer clic o Enter) |
| `onClearSearch` | function | `null` | Callback para limpiar la búsqueda |

### Props de Filtros

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `filterOptions` | array | `[]` | Configuración de filtros disponibles |
| `filters` | object | `{}` | Valores actuales de los filtros |
| `onFilterChange` | function | `null` | Callback para cambios en filtros |

### Props de Comportamiento

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `autoSearch` | boolean | `false` | Si es true, ejecuta búsqueda automática mientras se escribe |

### Props de Layout

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `searchColumnSize` | string | `'col-md-4'` | Clase CSS para el ancho del campo de búsqueda |
| `searchButtonColumnSize` | string | `'col-md-2'` | Clase CSS para el ancho del botón de búsqueda |
| `clearButtonColumnSize` | string | `'col-md-2'` | Clase CSS para el ancho del botón limpiar |
| `filterColumnSize` | string | `'col-md-3'` | Clase CSS para el ancho de cada filtro |

### Props de Personalización

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | string | `''` | Clases CSS adicionales para el contenedor |
| `showCard` | boolean | `true` | Renderizar dentro de una tarjeta Bootstrap |
| `cardClassName` | string | `'card mb-4'` | Clases CSS para la tarjeta |

## Estructura de filterOptions

```jsx
const filterOptions = [
    {
        field: 'status',           // Campo del filtro
        label: 'Estado',          // Etiqueta del filtro
        placeholder: 'Todos',     // Placeholder opcional
        options: [                // Opciones disponibles
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' }
        ]
    }
];
```

## Ejemplos Avanzados

### Solo Búsqueda
```jsx
<Search
    enableSearch={true}
    searchTerm={searchTerm}
    onSearchChange={handleSearch}
    showCard={false}
/>
```

### Solo Filtros
```jsx
<Search
    filterOptions={filterOptions}
    filters={filters}
    onFilterChange={handleFilterChange}
/>
```

### Layout Personalizado
```jsx
<Search
    enableSearch={true}
    searchColumnSize="col-md-6"
    searchButtonColumnSize="col-md-3"
    clearButtonColumnSize="col-md-3"
    filterColumnSize="col-md-4"
    cardClassName="card border-primary mb-3"
/>
```

## Estilos CSS

El componente incluye estilos CSS modulares en `search.css` que cubren:

- Estados de focus y hover
- Transiciones suaves
- Responsive design
- Animaciones para botones
- Estados de loading

## Integración con EntityTable

Este componente fue diseñado específicamente para reemplazar la funcionalidad de búsqueda en `EntityTable`, pero puede ser utilizado en cualquier otro componente que requiera capacidades de búsqueda y filtrado.
