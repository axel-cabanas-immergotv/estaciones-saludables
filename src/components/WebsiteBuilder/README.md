# Website Builder Component

Un sistema completo de construcción de páginas web con interfaz drag-and-drop, diseñado para reemplazar EditorJS.

## Características

- **Drag & Drop**: Reorganiza bloques arrastrándolos hacia arriba o abajo
- **Bloques Modulares**: Sistema de bloques extensible y personalizable
- **Edición en Tiempo Real**: Modifica contenido sin recargar la página
- **Vista Previa**: Alterna entre modo edición y vista previa
- **Responsive**: Diseño adaptativo para diferentes dispositivos
- **Ant Design**: Interfaz moderna y consistente

## Drag & Drop

El Website Builder incluye un sistema completo de drag & drop que permite reordenar bloques de manera intuitiva:

### Funcionalidades del Drag & Drop

- **Reordenamiento Vertical**: Mueve bloques hacia arriba o abajo
- **Drag Selectivo**: Solo el botón de drag es arrastrable, no todo el bloque
- **Sin Interferencias**: Los paneles de configuración y edición funcionan normalmente
- **Indicadores Visuales**: Handles de arrastre azules que aparecen al hacer hover
- **Feedback en Tiempo Real**: Animaciones y efectos visuales durante el arrastre
- **Actualización Automática**: El orden se actualiza automáticamente en los datos
- **Soporte Táctil**: Funciona en dispositivos móviles y tablets

### Cómo Usar

1. **Hover sobre un bloque**: Aparece el handle de arrastre azul (⋮⋮) en la esquina superior derecha
2. **Click y arrastra**: Haz click SOLO en el handle azul y arrastra hacia arriba o abajo
3. **Suelta**: Suelta el bloque en la nueva posición
4. **Orden actualizado**: El bloque se reordena automáticamente

**Importante**: Solo el botón azul de drag es arrastrable. El resto del bloque mantiene su funcionalidad normal (configuración, edición, etc.).

### Componente SortableBlock

Cada bloque está envuelto en un `SortableBlock` que maneja:
- Eventos de drag & drop
- Feedback visual durante el arrastre
- Integración con `@dnd-kit` para funcionalidad avanzada

## Bloques Disponibles

### 1. Text Block (📝)
- Contenido de texto editable
- Personalización de fuente, color y alineación
- Editor de texto en tiempo real

### 2. Heading Block (🔤)
- Encabezados H1-H6
- Personalización de nivel, color y alineación
- Tamaños automáticos según nivel

### 3. Image Block (🖼️)
- Inserción de imágenes por URL
- Personalización de dimensiones y estilo
- Texto alternativo para accesibilidad

### 4. Button Block (🔘)
- Botones personalizables
- Múltiples variantes y tamaños
- Enlaces configurables

### 5. Column Block (📊)
- Sistema de columnas flexible (1-12)
- Anidamiento de otros bloques
- Personalización de ancho y estilo

### 6. Posts Reel Block (📰)
- Visualización de posts
- Layouts vertical y horizontal
- Configuración de categorías y límites

## Uso Básico

```jsx
import WebsiteBuilder from './components/WebsiteBuilder';

const MyPage = () => {
  const [page, setPage] = useState({
    id: 'my-page',
    title: 'Mi Página',
    content: []
  });

  const handlePageUpdate = (updatedContent) => {
    // updatedContent is the JSON output for the specific field
    setPage(prev => ({ ...prev, content: updatedContent }));
  };

  const handleSave = (finalOutput) => {
    // finalOutput is the JSON output based on fieldKey
    console.log('Contenido guardado:', finalOutput);
  };

  return (
    <WebsiteBuilder
      page={page}
      fieldKey="content"           // Key del campo donde se guardará
      generateOutput={true}        // Generar output JSON
      onPageUpdate={handlePageUpdate}
      onSave={handleSave}
    />
  );
};
```

## Sistema de JSON por Campo

El Website Builder genera diferentes tipos de JSON según el `fieldKey` especificado, permitiendo integración flexible con diferentes sistemas:

### Configuración de Campo

```jsx
<WebsiteBuilder
  page={pageData}
  fieldKey="content"           // Nombre del campo donde se guardará
  generateOutput={true}        // Habilitar generación de JSON
  onPageUpdate={handleUpdate}
  onSave={handleSave}
/>
```

### Tipos de Output por FieldKey

#### 1. `fieldKey="content"` (Default)
```javascript
// Output: Array directo de bloques
[
  { id: 'block-1', type: 'heading', props: {...}, order: 0 },
  { id: 'block-2', type: 'text', props: {...}, order: 1 }
]
```

#### 2. `fieldKey="layout"`
```javascript
// Output: Objeto estructurado con metadata
{
  blocks: [...],
  layout: 'vertical',
  version: '1.0'
}
```

#### 3. `fieldKey="page_content"`
```javascript
// Output: Contenido completo con metadata
{
  blocks: [...],
  metadata: {
    title: 'Page Title',
    lastModified: '2024-01-01T00:00:00.000Z'
  }
}
```

#### 4. `fieldKey="custom"`
```javascript
// Output: Estructura personalizada
{
  custom: [...],
  pageData: { id: '...', title: '...', content: [...] }
}
```

### Integración con Formularios

```jsx
// En DynamicPage o cualquier formulario
{
  name: 'content',
  label: 'Page Content',
  type: 'editor',
  panel: 'main'
}

// El Website Builder automáticamente:
// 1. Genera JSON para el campo 'content'
// 2. Llama a onPageUpdate con el JSON generado
// 3. El formulario guarda el JSON en formData.content
```

## Estructura de Datos

### Page Object
```javascript
{
  id: 'string',
  title: 'string',
  slug: 'string',
  content: Block[],
  status: 'draft' | 'published',
  created_at: 'ISO string',
  updated_at: 'ISO string'
}
```

### Block Object
```javascript
{
  id: 'string',
  type: 'text' | 'heading' | 'image' | 'button' | 'column' | 'posts-reel',
  props: Object, // Propiedades específicas del bloque
  order: number,
  children: Block[] // Para bloques anidables como column
}
```

## Personalización

### Agregar Nuevos Bloques

1. Crear el componente del bloque en `src/components/WebsiteBuilder/blocks/`
2. Implementar la interfaz estándar:
   - Props: `block`, `onUpdate`, `onDelete`, `isEditing`
   - Modo edición con controles de configuración
   - Modo vista previa limpio

3. Registrar en `BlockRenderer.jsx`
4. Agregar a `availableBlocks` en `types/index.js`

### Estilos CSS

Los estilos están en `websiteBuilder.css` y siguen la metodología BEM:
- `.block-container` - Contenedor base del bloque
- `.block-header` - Encabezado con controles
- `.block-content` - Contenido principal del bloque
- `.editing` / `.preview` - Estados del bloque

## Dependencias

- `@dnd-kit/core` - Drag & Drop
- `@dnd-kit/sortable` - Ordenamiento
- `antd` - Componentes de UI
- `@ant-design/icons` - Iconos

## Compatibilidad

- React 19+
- Navegadores modernos (ES6+)
- Soporte para dispositivos táctiles

## Ejemplo Completo

Ver `example.jsx` para un ejemplo completo de implementación con datos de muestra.

## Migración desde EditorJS

1. **Eliminar dependencias**: Ya completado
2. **Reemplazar componentes**: Usar `WebsiteBuilder` en lugar de `EditorJs`
3. **Adaptar datos**: Convertir bloques de EditorJS al nuevo formato
4. **Actualizar servicios**: Modificar lógica de guardado/carga

## Contribución

Para agregar nuevas funcionalidades:

1. Crear feature branch
2. Implementar cambios
3. Agregar tests si es posible
4. Documentar cambios
5. Crear pull request

## Licencia

MIT License - Ver archivo LICENSE para más detalles.
