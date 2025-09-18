# 🎛️ Sistema de Paneles Flexibles - 100% Agnóstico

> **Sistema completamente configurable sin hardcoding de nombres de campos**  
> **Componentes DynamicPage, DynamicStory y DynamicModal totalmente agnósticos**

## 🎯 Objetivo

Los componentes dinámicos (`DynamicPage`, `DynamicStory`, `DynamicModal`) deben ser **100% agnósticos** y no tener ningún conocimiento del dominio específico. No deben contener:

- ❌ `defaultPanels` hardcodeados
- ❌ Lógica específica de nombres de campos (`title`, `content`, etc.)
- ❌ Fallbacks automáticos basados en nombres
- ❌ Cualquier conocimiento del dominio de negocio

## 🏗️ Arquitectura

### Componentes 100% Agnósticos

```javascript
// ✅ CORRECTO: Sin defaults, 100% configurable
const panels = config.panels || {};

// ❌ INCORRECTO: Hardcoding de paneles
const defaultPanels = {
    main: { title: 'Content', showInMain: true },
    // ... más hardcoding
};
```

### Sistema de Agrupación

```javascript
// ✅ CORRECTO: Solo usa configuración explícita
fields.forEach(field => {
    // Solo usar field.panel si está especificado Y existe en config
    if (field.panel && panels[field.panel]) {
        groupedFields[field.panel].push(field);
    }
    // Alternativa: field.group como alias
    else if (field.group && panels[field.group]) {
        groupedFields[field.group].push(field);
    }
    // NO fallback - si no se especifica panel, el campo no se agrupa
});
```

## 📋 Configuración Completa

### 1. DynamicPage - Para entidades complejas

```javascript
editorConfig: {
    title: 'Entity Editor',
    // OBLIGATORIO: Definir todos los paneles explícitamente
    panels: {
        main: { 
            title: 'Content', 
            showInMain: true, 
            showInSidebar: false 
        },
        publish: { 
            title: 'Publish Settings', 
            showInMain: false, 
            showInSidebar: true 
        },
        seo: { 
            title: 'SEO Settings', 
            showInMain: false, 
            showInSidebar: true 
        }
    },
    fields: [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            panel: 'main'  // OBLIGATORIO: Asignación explícita
        },
        {
            name: 'content',
            label: 'Content', 
            type: 'editor',
            panel: 'main'  // OBLIGATORIO: Asignación explícita
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            panel: 'publish'  // OBLIGATORIO: Asignación explícita
        }
    ]
}
```

### 2. DynamicStory - Para contenido narrativo

```javascript
editorConfig: {
    title: 'Story Editor',
    // OBLIGATORIO: Definir paneles para story layout
    panels: {
        main: { 
            title: 'Story Content', 
            showInMain: true, 
            showInSidebar: false 
        },
        publish: { 
            title: 'Publish Settings', 
            showInMain: false, 
            showInSidebar: true 
        },
        settings: { 
            title: 'Story Settings', 
            showInMain: false, 
            showInSidebar: true 
        }
    },
    fields: [
        {
            name: 'title',
            panel: 'main'  // Área principal
        },
        {
            name: 'content', 
            type: 'editor',
            panel: 'main'  // Área principal
        },
        {
            name: 'status',
            panel: 'publish'  // Sidebar
        }
    ]
}
```

### 3. DynamicModal - Para entidades simples

```javascript
editorConfig: {
    title: 'Simple Editor',
    // NO necesita panels - renderiza campos linealmente
    fields: [
        {
            name: 'name',
            label: 'Name',
            type: 'text'
            // NO panel - DynamicModal es simple
        }
    ]
}
```

## 🔧 Configuración de Paneles

### Propiedades de Panel

```javascript
panels: {
    panelKey: {
        title: 'Panel Title',           // Título mostrado en UI
        showInMain: boolean,            // Mostrar en área principal
        showInSidebar: boolean          // Mostrar en sidebar
    }
}
```

### Ejemplos de Configuraciones

#### Para Páginas Complejas:
```javascript
panels: {
    main: { title: 'Page Content', showInMain: true, showInSidebar: false },
    publish: { title: 'Publish Settings', showInMain: false, showInSidebar: true },
    seo: { title: 'SEO Settings', showInMain: false, showInSidebar: true },
    menu: { title: 'Menu Settings', showInMain: false, showInSidebar: true },
    advanced: { title: 'Advanced', showInMain: false, showInSidebar: true }
}
```

#### Para Menús Jerárquicos:
```javascript
panels: {
    main: { title: 'Menu Content', showInMain: true, showInSidebar: false },
    publish: { title: 'Publish Settings', showInMain: false, showInSidebar: true },
    settings: { title: 'Menu Settings', showInMain: false, showInSidebar: true }
}
```

## 📝 Asignación de Campos

### Métodos de Asignación

```javascript
// Método 1: Usando 'panel'
{
    name: 'title',
    panel: 'main'
}

// Método 2: Usando 'group' (alias)
{
    name: 'title', 
    group: 'main'
}

// Sin asignación: Campo NO se agrupa (puede causar que no se muestre)
{
    name: 'orphan_field'
    // NO se mostrará si no está en un panel configurado
}
```

### ⚠️ Reglas Importantes

1. **Panel debe existir**: Si `field.panel` no existe en `config.panels`, el campo no se agrupa
2. **Sin fallbacks**: No hay lógica automática de fallback
3. **Configuración explícita**: Cada campo debe especificar su panel
4. **Validación**: El sistema no valida configuraciones faltantes

## 🔄 Flujo de Renderizado

### DynamicPage

```javascript
1. Leer config.panels (sin defaults)
2. Crear groupedFields basado en panels configurados
3. Agrupar fields solo si field.panel existe en panels
4. Renderizar main area: panels con showInMain: true
5. Renderizar sidebar: panels con showInSidebar: true
```

### DynamicStory

```javascript
1. Mismo flujo que DynamicPage
2. Layout optimizado para narrativa
3. Sidebar mínimo con paneles compactos
```

### DynamicModal

```javascript
1. NO usa sistema de paneles
2. Renderiza fields linealmente en el modal
3. Diseño simple de una columna
```

## ✅ Ejemplos Implementados

### Pages (DynamicPage)
```javascript
// Paneles: main, publish, seo, menu, advanced
// Campos con panel explícito en cada uno
```

### Menus (DynamicStory)  
```javascript
// Paneles: main, publish, settings
// MenuItemsEditor en main, configuraciones en sidebar
```

### Categories/Users (DynamicModal)
```javascript
// Sin paneles, campos simples lineales
```

## 🚫 Qué NO Hacer

```javascript
// ❌ NO hardcodear paneles por defecto
const defaultPanels = { main: {...}, publish: {...} };

// ❌ NO usar lógica de fallback basada en nombres
if (field.name === 'title') return 'main';

// ❌ NO asumir estructura de datos específica
switch (field.name) {
    case 'title': case 'content': 
        return 'main';
}

// ❌ NO acoplar a dominio específico
if (['status', 'template'].includes(field.name)) {
    return 'publish';
}
```

## ✅ Qué SÍ Hacer

```javascript
// ✅ Sistema 100% configurable
const panels = config.panels || {};

// ✅ Solo usar configuración explícita
if (field.panel && panels[field.panel]) {
    groupedFields[field.panel].push(field);
}

// ✅ Sin fallbacks, sin asumir nada
// Cada entidad define completamente su configuración

// ✅ Componentes agnósticos
// No conocen conceptos como 'title', 'content', 'status'
```

## 🔧 Migración

### Para entidades existentes:

1. **Definir config.panels** explícitamente
2. **Añadir field.panel** a cada campo
3. **Eliminar dependencia** de nombres hardcodeados
4. **Testear configuración** completa

### Checklist:

- [ ] ¿Config.panels definido?
- [ ] ¿Todos los fields tienen panel asignado?
- [ ] ¿No hay references a nombres específicos de campos?
- [ ] ¿Build exitoso?
- [ ] ¿UI renderiza correctamente?

---

**💡 El objetivo es tener componentes dinámicos totalmente reutilizables que puedan renderizar cualquier configuración sin conocimiento del dominio específico.** 