# DynamicPage Component

Un componente de edición de páginas completo con integración del Website Builder, diseñado para reemplazar EditorJS.

## Características

- **Editor de Páginas Completo**: Interfaz full-screen para edición de contenido
- **Website Builder Integrado**: Sistema de construcción de páginas con drag-and-drop
- **Sistema de Paneles**: Organización flexible de campos en diferentes secciones
- **Validación Avanzada**: Validación personalizable de formularios
- **Campos Personalizados**: Soporte para campos custom con múltiples enfoques
- **Responsive**: Diseño adaptativo para diferentes dispositivos

## Integración con Website Builder

DynamicPage ahora incluye el Website Builder como editor de contenido principal, reemplazando completamente EditorJS:

### Campo de Tipo 'editor'

```jsx
{
  name: 'content',
  label: 'Page Content',
  type: 'editor', // Esto activa el Website Builder
  required: true,
  help: 'Use the Website Builder to create your page layout',
  panel: 'main'
}
```

### Funcionalidades del Website Builder

- **Drag & Drop**: Reorganiza bloques arrastrándolos
- **6 Tipos de Bloques**: Text, Heading, Image, Button, Column, Posts Reel
- **Edición en Tiempo Real**: Modifica contenido sin recargar
- **Sistema de Columnas**: Layout flexible con anidamiento
- **Configuración por Bloque**: Personaliza cada bloque individualmente

## Uso Básico

```jsx
import DynamicPage from './components/DynamicPage';

const MyPageEditor = () => {
  const config = {
    entityType: 'page',
    fields: [
      {
        name: 'title',
        label: 'Page Title',
        type: 'text',
        required: true,
        panel: 'main'
      },
      {
        name: 'content',
        label: 'Page Content',
        type: 'editor', // Website Builder
        required: true,
        panel: 'main'
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'text',
        required: true,
        panel: 'seo'
      }
    ],
    panels: {
      main: {
        title: 'Main Content',
        showInMain: true,
        showInSidebar: false
      },
      seo: {
        title: 'SEO Settings',
        showInMain: false,
        showInSidebar: true
      }
    }
  };

  return (
    <DynamicPage
      show={true}
      title="Edit Page"
      config={config}
      entityData={pageData}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};
```

## Configuración de Campos

### Tipos de Campo Disponibles

- **text**: Campo de texto simple
- **textarea**: Área de texto multilínea
- **select**: Selector desplegable
- **checkbox**: Casilla de verificación
- **editor**: Website Builder (reemplaza EditorJS)
- **custom**: Campo personalizado con renderizado custom

### Configuración de Paneles

```jsx
panels: {
  main: {
    title: 'Main Content',
    showInMain: true,    // Se muestra en el área principal
    showInSidebar: false  // No se muestra en la barra lateral
  },
  seo: {
    title: 'SEO Settings',
    showInMain: false,    // No se muestra en el área principal
    showInSidebar: true   // Se muestra en la barra lateral
  }
}
```

## Estructura de Datos

### Formato de Contenido del Website Builder

```javascript
{
  content: [
    {
      id: 'block-1',
      type: 'heading',
      props: {
        text: 'Welcome',
        level: 1,
        color: '#333',
        textAlign: 'center'
      },
      order: 0,
      children: []
    },
    {
      id: 'block-2',
      type: 'column',
      props: {
        width: 6,
        backgroundColor: '#f8f9fa'
      },
      order: 1,
      children: [
        // Bloques anidados
      ]
    }
  ]
}
```

## Migración desde EditorJS

### Cambios Principales

1. **Campo 'editor'**: Ahora renderiza el Website Builder en lugar de EditorJS
2. **Estructura de Datos**: El contenido se almacena como array de bloques
3. **Funcionalidad**: Drag & drop, edición visual, bloques modulares

### Adaptación de Datos Existentes

```javascript
// Antes (EditorJS)
content: { blocks: [...] }

// Ahora (Website Builder)
content: [...] // Array directo de bloques
```

## Personalización

### Campos Custom

```jsx
{
  name: 'custom_field',
  type: 'custom',
  render: (value, onChange, formData) => (
    <MyCustomComponent
      value={value}
      onChange={onChange}
      data={formData}
    />
  )
}
```

### Validación Personalizada

```jsx
config: {
  customValidation: (formData) => {
    const errors = {};
    if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    return errors;
  }
}
```

### Procesamiento Antes de Guardar

```jsx
config: {
  onBeforeSave: (data) => {
    // Auto-generate slug
    if (!data.slug && data.title) {
      data.slug = generateSlug(data.title);
    }
    return data;
  }
}
```

## Estilos CSS

### Clases Principales

- `.page-editor-container` - Contenedor principal
- `.editor-header` - Encabezado del editor
- `.editor-main` - Área principal de edición
- `.editor-sidebar` - Barra lateral
- `.website-builder-field` - Campo del Website Builder

### Personalización de Estilos

```css
/* Personalizar el Website Builder integrado */
.website-builder-field .website-builder {
  height: 100%;
  padding: 0;
}

.website-builder-field .builder-header {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
```

## Ejemplos

Ver `example.jsx` para un ejemplo completo de implementación con:
- Configuración de campos
- Sistema de paneles
- Integración del Website Builder
- Validación y procesamiento de datos

## Compatibilidad

- React 19+
- Navegadores modernos (ES6+)
- Soporte para dispositivos táctiles
- Integración completa con Ant Design

## Dependencias

- `@dnd-kit/core` - Drag & Drop
- `@dnd-kit/sortable` - Ordenamiento
- `antd` - Componentes de UI
- `@ant-design/icons` - Iconos

## Contribución

Para agregar nuevas funcionalidades:

1. Crear feature branch
2. Implementar cambios
3. Agregar tests si es posible
4. Documentar cambios
5. Crear pull request

## Licencia

MIT License - Ver archivo LICENSE para más detalles.
