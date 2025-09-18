# SelectRelation Component

Un componente React completamente aislado y encapsulado para establecer relaciones entre entidades con funcionalidades similares a Select2.

## 🚀 Características Principales

- **Selección única o múltiple**: Soporta tanto relaciones de uno a uno como de uno a muchos
- **Búsqueda en tiempo real**: Búsqueda con debounce configurable para mejorar el rendimiento
- **Configuración AJAX avanzada**: Soporte completo para endpoints personalizados con procesamiento de datos
- **Datos locales y remotos**: Puede trabajar con arrays locales o APIs remotas
- **Templates personalizables**: Plantillas HTML personalizadas para resultados y selecciones
- **Modo tags**: Permite crear nuevas opciones dinámicamente
- **Navegación por teclado**: Soporte completo para navegación con teclado
- **Soporte RTL**: Dirección de texto de derecha a izquierda
- **Internacionalización**: Soporte multiidioma con mensajes personalizables
- **Temas visuales**: Múltiples temas predefinidos (classic, modern, minimal)
- **Responsive**: Diseño adaptativo para dispositivos móviles y desktop
- **Accesibilidad**: Soporte completo para lectores de pantalla y navegación por teclado
- **Tema oscuro**: Soporte automático para preferencias de tema del sistema
- **Manejo de errores**: Visualización clara de errores de API y validaciones
- **Modo debug**: Logging detallado para desarrollo y troubleshooting

## 📦 Instalación

El componente está completamente aislado y no requiere dependencias externas adicionales. Solo asegúrate de tener React instalado en tu proyecto.

## 🎯 Uso Básico

### Selección Única con AJAX

```jsx
import SelectRelation from './components/SelectRelation';

function StoryForm() {
    const [owner, setOwner] = useState([]);

    return (
        <form>
            <SelectRelation
                entity="users"
                ajax={{
                    url: '/api/users',
                    dataType: 'json',
                    delay: 250,
                    data: params => ({ q: params.term }),
                    processResults: data => ({ results: data.items })
                }}
                key="id"
                label="name"
                multiple={false}
                selectedItems={owner}
                onChange={setOwner}
                fieldLabel="Story Owner"
                placeholder="Select a user..."
                required={true}
                allowClear={true}
                minimumInputLength={2}
            />
        </form>
    );
}
```

### Selección Múltiple con Datos Locales

```jsx
import SelectRelation from './components/SelectRelation';

function StoryForm() {
    const [categories, setCategories] = useState([]);
    
    const localCategories = [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Business' },
        { id: 3, name: 'Science' }
    ];

    return (
        <form>
            <SelectRelation
                entity="categories"
                data={localCategories}
                key="id"
                label="name"
                multiple={true}
                selectedItems={categories}
                onChange={setCategories}
                fieldLabel="Story Categories"
                placeholder="Select categories..."
                required={false}
                maximumSelectionLength={5}
                allowClear={true}
                closeOnSelect={false}
            />
        </form>
    );
}
```

## ⚙️ Props del Componente

### Props Requeridas

| Prop | Tipo | Descripción | Ejemplo |
|------|------|-------------|---------|
| `entity` | string | Nombre de la entidad/tabla para búsqueda | `"users"`, `"categories"` |
| `key` | string | Campo que se usará como valor/ID | `"id"`, `"uuid"`, `"slug"` |
| `label` | string | Campo que se mostrará como etiqueta | `"name"`, `"email"`, `"title"` |
| `onChange` | function | Callback cuando cambia la selección | `(items) => setSelected(items)` |

### Props de Datos (Obligatorio uno de los dos)

| Prop | Tipo | Descripción | Ejemplo |
|------|------|-------------|---------|
| `apiURL` | string | Endpoint de la API simple | `"/api/users"` |
| `ajax` | object | Configuración AJAX avanzada | Ver sección AJAX |

### Props Opcionales Básicas

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `multiple` | boolean | `false` | Permite selección múltiple |
| `selectedItems` | array | `[]` | Elementos actualmente seleccionados |
| `fieldLabel` | string | `undefined` | Etiqueta del campo del formulario |
| `placeholder` | string | `"Select {entity}..."` | Texto de placeholder |
| `required` | boolean | `false` | Indica si el campo es requerido |
| `disabled` | boolean | `false` | Deshabilita el componente |
| `className` | string | `""` | Clases CSS adicionales |
| `style` | object | `{}` | Estilos inline adicionales |

### Props de Búsqueda y Filtrado

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `minimumInputLength` | number | `0` | Mínimo de caracteres para buscar |
| `maximumInputLength` | number | `null` | Máximo de caracteres permitidos |
| `minimumResultsForSearch` | number | `0` | Mínimo de resultados para mostrar búsqueda |
| `filter` | object | `{}` | Filtros adicionales para la API |

### Props de Selección

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `allowClear` | boolean | `false` | Permite limpiar la selección |
| `closeOnSelect` | boolean | `true` | Cierra dropdown al seleccionar |
| `selectOnClose` | boolean | `false` | Selecciona al cerrar dropdown |
| `maximumSelectionLength` | number | `null` | Máximo de elementos seleccionables |

### Props de Personalización

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `theme` | string | `"default"` | Tema visual (default, classic, modern, minimal) |
| `width` | string | `"100%"` | Ancho del control |
| `dir` | string | `"ltr"` | Dirección del texto (ltr, rtl) |
| `language` | string/object | `"en"` | Idioma o mensajes personalizados |
| `tags` | boolean | `false` | Permite crear nuevas opciones |
| `debug` | boolean | `false` | Habilita mensajes de debug |

### Props de Templates

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `templateResult` | function | `null` | Plantilla para resultados en lista |
| `templateSelection` | function | `null` | Plantilla para elementos seleccionados |
| `escapeMarkup` | function | `null` | Función de escape HTML personalizada |

### Props de AJAX Avanzado

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `ajax.delay` | number | `250` | Retraso en milisegundos para búsqueda |
| `ajax.data` | function | `null` | Función para procesar parámetros |
| `ajax.processResults` | function | `null` | Función para procesar respuesta |
| `ajax.headers` | object | `{}` | Headers HTTP personalizados |

## 🔧 Configuración AJAX

### Configuración Básica

```jsx
<SelectRelation
    entity="users"
    ajax={{
        url: '/api/users',
        dataType: 'json',
        delay: 250,
        data: params => ({ q: params.term }),
        processResults: data => ({ results: data.items })
    }}
    // ... otras props
/>
```

### Configuración Avanzada

```jsx
<SelectRelation
    entity="stories"
    ajax={{
        url: '/api/stories',
        dataType: 'json',
        delay: 300,
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Version': '2.0'
        },
        data: params => ({ 
            search: params.term,
            category: 'technology',
            published: true
        }),
        processResults: data => ({ 
            results: data.stories.map(story => ({
                ...story,
                text: story.title,
                author: story.author.name
            }))
        })
    }}
    // ... otras props
/>
```

## 🎨 Templates Personalizados

### Template de Resultados

```jsx
<SelectRelation
    // ... otras props
    templateResult={(item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
            <span style={{ fontSize: '0.8em', color: '#666' }}>
                {item.email}
            </span>
        </div>
    )}
/>
```

### Template de Selección

```jsx
<SelectRelation
    // ... otras props
    templateSelection={(item) => (
        <span style={{ fontWeight: '500' }}>
            👤 {item.name} ({item.role})
        </span>
    )}
/>
```

## 🌍 Internacionalización

### Idioma Predefinido

```jsx
<SelectRelation
    // ... otras props
    language="es"
/>
```

### Mensajes Personalizados

```jsx
<SelectRelation
    // ... otras props
    language={{
        noResults: () => "No se encontraron resultados",
        searching: () => "Buscando...",
        loading: () => "Cargando...",
        error: () => "Error al cargar datos",
        inputTooShort: () => "Por favor ingrese más caracteres",
        inputTooLong: () => "Por favor ingrese menos caracteres",
        maximumSelected: () => "Solo puede seleccionar {0} elementos"
    }}
/>
```

## 🎯 Modo Tags

```jsx
<SelectRelation
    // ... otras props
    tags={true}
    minimumInputLength={1}
    placeholder="Type to search or create tags..."
/>
```

## ⌨️ Navegación por Teclado

- **Tab**: Navegar entre elementos interactivos
- **Enter/Space**: Seleccionar elemento o abrir/cerrar dropdown
- **Arrow Up/Down**: Navegar por elementos del dropdown
- **Escape**: Cerrar dropdown
- **Backspace**: Eliminar último elemento seleccionado (en modo múltiple)

## 🎨 Temas Visuales

### Tema Classic
```jsx
<SelectRelation
    // ... otras props
    theme="classic"
/>
```

### Tema Modern
```jsx
<SelectRelation
    // ... otras props
    theme="modern"
/>
```

### Tema Minimal
```jsx
<SelectRelation
    // ... otras props
    theme="minimal"
/>
```

## 🌐 Soporte RTL

```jsx
<SelectRelation
    // ... otras props
    dir="rtl"
    language="ar"
/>
```

## 🔍 Búsqueda Personalizada

### Matcher Personalizado

```jsx
<SelectRelation
    // ... otras props
    matcher={(params, data) => {
        const term = params.term.toLowerCase();
        const text = data.name.toLowerCase();
        
        // Prioridad: coincidencia exacta
        if (text === term) return true;
        
        // Segunda prioridad: comienza con
        if (text.startsWith(term)) return true;
        
        // Tercera prioridad: contiene
        return text.includes(term);
    }}
/>
```

## 📱 Responsive Design

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Dropdown posicionado normalmente
- **Tablet**: Dropdown ajustado para pantallas medianas
- **Mobile**: Dropdown modal centrado en pantalla

## ♿ Accesibilidad

- **ARIA labels**: Etiquetas apropiadas para lectores de pantalla
- **Focus management**: Manejo correcto del foco
- **Keyboard navigation**: Navegación completa por teclado
- **Screen reader support**: Compatible con lectores de pantalla
- **High contrast**: Soporte para modo de alto contraste

## 🚀 Rendimiento

### Optimizaciones Implementadas

- **Debounced search**: Búsqueda con retraso configurable
- **Memoization**: Uso de useCallback para funciones
- **Efficient re-renders**: Minimiza re-renderizados innecesarios

### Consideraciones de Rendimiento

- La búsqueda se ejecuta solo después del delay configurado
- Los filtros se aplican en el servidor, no en el cliente
- El estado se mantiene localmente para evitar re-renderizados

## 🐛 Modo Debug

```jsx
<SelectRelation
    // ... otras props
    debug={true}
/>
```

Habilita logging detallado en la consola para desarrollo y troubleshooting.

## 📋 Ejemplos de Implementación

### 1. Búsqueda de Usuarios con AJAX

```jsx
<SelectRelation
    entity="users"
    ajax={{
        url: '/api/users/search',
        delay: 300,
        data: params => ({ 
            q: params.term,
            role: 'author',
            status: 'active'
        }),
        processResults: data => ({ results: data.users })
    }}
    key="id"
    label="name"
    multiple={false}
    selectedItems={selectedUser}
    onChange={setSelectedUser}
    fieldLabel="Author"
    placeholder="Search for author..."
    allowClear={true}
    minimumInputLength={2}
    theme="modern"
/>
```

### 2. Selección de Categorías con Datos Locales

```jsx
<SelectRelation
    entity="categories"
    data={categoriesList}
    key="id"
    label="name"
    multiple={true}
    selectedItems={selectedCategories}
    onChange={setSelectedCategories}
    fieldLabel="Categories"
    placeholder="Select categories..."
    maximumSelectionLength={5}
    allowClear={true}
    closeOnSelect={false}
    theme="classic"
/>
```

### 3. Modo Tags para Etiquetas

```jsx
<SelectRelation
    entity="tags"
    ajax={{
        url: '/api/tags',
        delay: 200,
        data: params => ({ q: params.term }),
        processResults: data => ({ results: data.tags })
    }}
    key="id"
    label="name"
    multiple={true}
    selectedItems={selectedTags}
    onChange={setSelectedTags}
    fieldLabel="Tags"
    placeholder="Type to search or create tags..."
    tags={true}
    minimumInputLength={1}
    allowClear={true}
    theme="minimal"
/>
```

## 🔧 Personalización de Estilos

### Clases CSS Personalizadas

```jsx
<SelectRelation
    // ... otras props
    className="custom-select-relation premium-theme"
    dropdownCssClass="custom-dropdown"
    selectionCssClass="custom-selection"
/>
```

### Estilos Inline

```jsx
<SelectRelation
    // ... otras props
    style={{
        border: '2px solid #8b5cf6',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.1)'
    }}
/>
```

## 🚨 Manejo de Errores

El componente maneja automáticamente:

- **Errores de API**: Muestra mensajes de error claros
- **Validación de entrada**: Mensajes para longitud mínima/máxima
- **Límites de selección**: Advertencias cuando se alcanza el máximo
- **Estados de carga**: Indicadores visuales de loading
- **Sin resultados**: Mensajes apropiados cuando no hay datos

## 🔄 Migración desde el Componente Relation

### Cambios Principales

1. **Props renombradas**:
   - `fetchItems` → `ajax` o `apiURL`
   - `key` → `key` (mismo nombre, mejor funcionalidad)
   - `value` → `key` (consolidado en una sola prop)

2. **Nuevas funcionalidades**:
   - Configuración AJAX avanzada
   - Búsqueda en tiempo real
   - Templates personalizables
   - Modo tags
   - Navegación por teclado
   - Soporte RTL
   - Internacionalización

### Ejemplo de Migración

```jsx
// Antes (Relation)
<Relation
    entity="users"
    fetchItems={async () => await fetchUsers()}
    key="name"
    value="id"
    // ... otras props
/>

// Después (SelectRelation)
<SelectRelation
    entity="users"
    ajax={{
        url: '/api/users',
        delay: 250,
        data: params => ({ q: params.term }),
        processResults: data => ({ results: data })
    }}
    key="id"
    label="name"
    // ... otras props
/>
```

## 🧪 Testing y Debugging

### Modo Debug

```jsx
<SelectRelation
    // ... otras props
    debug={true}
/>
```

### Logs de Consola

El componente registra información detallada cuando debug está habilitado:
- Carga de elementos
- Búsquedas realizadas
- Selecciones y eliminaciones
- Errores de API
- Cambios de estado

## 🤝 Contribución

El componente está diseñado para ser extensible. Puedes contribuir agregando:

- Nuevos temas visuales
- Adaptadores personalizados
- Funcionalidades de arrastrar y soltar
- Integración con más librerías de UI
- Nuevos tipos de filtros
- Soporte para más formatos de API

## 📄 Licencia

Este componente es parte del proyecto Fisca y está sujeto a la licencia del proyecto.

## 🔗 Referencias

- **Select2**: Inspiración para funcionalidades avanzadas
- **React**: Framework base del componente
- **Accessibility**: Estándares WCAG 2.1
- **Material Design**: Principios de diseño utilizados
