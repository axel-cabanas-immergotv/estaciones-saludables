# 📋 Entity Integration Rules - API + React Components

> **Versión**: 1.2  
> **Implementado en**: Pages (ejemplo de referencia)  
> **Última actualización**: Diciembre 2024

## 🎯 Propósito

Este documento define la arquitectura estándar para integrar entidades del sistema con React, incluyendo:
- Servicios de API (`*Service.js`)
- Componentes de tabla (`EntityTable`)
- **3 tipos de editores dinámicos**: `DynamicPage`, `DynamicModal`, `DynamicStory`
- Páginas de administración (`src/pages/Admin/`)

## 🏗️ Arquitectura General

```
Entity Page (React)
    ↓
EntityTable (Table + CRUD)
    ↓
DynamicPage/Modal/Story (Editors)
    ↓
EntityService (API Layer)
    ↓
Backend API (/api/admin/entity)
```

---

## 📁 Estructura de Archivos Obligatoria

### Para cada entidad nueva:

```
src/
├── services/
│   └── [entity]Service.js          # API service (ej: pagesService.js)
├── pages/Admin/[Entity]/
│   └── index.jsx                   # Página principal (ej: Pages/index.jsx)
└── components/                     # Componentes reutilizables (ya existentes)
    ├── EntityTable/
    ├── DynamicPage/                # Editor fullscreen con sidebar
    ├── DynamicModal/               # Modal para entidades simples
    └── DynamicStory/               # Editor para contenido rich text
```

### Nomenclatura:
- **Service**: `[entity]Service.js` (ej: `pagesService.js`, `usersService.js`)
- **Page**: `[Entity]/index.jsx` (ej: `Pages/index.jsx`, `Users/index.jsx`)  
- **Variables**: camelCase para JS, snake_case para API fields

---

## 🎨 Tipos de Editores Dinámicos

### 1. **DynamicPage** 📄 (Fullscreen Editor)

**Cuándo usar:**
- Entidades complejas con muchos campos
- Contenido con Editor.js
- Configuraciones avanzadas (SEO, CSS, jerarquía)

**Entidades típicas:** Pages, Modules, Menus, Settings

**Características:**
- **Fullscreen** ocupando toda la pantalla
- **Header** con botón BACK, título, selector de estado y botón SAVE
- **Layout horizontal**: Editor principal (izquierda) + Sidebar de configuración (derecha)
- **Sidebar paneles**: Publish, Hierarchy, SEO, Custom CSS, Menu, Settings
- **Editor.js integrado** para contenido rich text
- **Auto-agrupación** de campos por paneles

**Ejemplo de configuración:**
```javascript
editorType: 'page',
editorConfig: {
    title: 'Page Editor',
    fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'content', label: 'Content', type: 'editor' },
        { name: 'status', label: 'Status', type: 'select', options: [...] },
        { name: 'slug', label: 'Slug', type: 'text' },
        { name: 'meta_description', label: 'Meta Description', type: 'textarea' },
        { name: 'custom_css', label: 'Custom CSS', type: 'textarea' },
        { name: 'show_in_menu', label: 'Show in Menu', type: 'checkbox' }
    ],
    editorConfig: {
        holderId: 'page-content-editor',
        placeholder: 'Start creating...'
    }
}
```

### 2. **DynamicModal** 🪟 (Modal Editor)

**Cuándo usar:**
- Entidades simples con pocos campos
- CRUD básico y rápido
- Formularios que no requieren mucho espacio

**Entidades típicas:** Users, Categories, Roles, Tags

**Características:**
- **Modal overlay** sobre la tabla
- **Formulario compacto** en una sola columna
- **Campos básicos**: text, select, textarea, checkbox
- **Sin Editor.js** (solo campos simples)
- **Validación en tiempo real**

**Ejemplo de configuración:**
```javascript
editorType: 'modal',
editorConfig: {
    title: 'User Editor',
    fields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'role_id', label: 'Role', type: 'select', options: [...] },
        { name: 'status', label: 'Status', type: 'select', options: [...] }
    ]
}
```

### 3. **DynamicStory** 📰 (Story Editor)

**Cuándo usar:**
- Contenido narrativo o artículos
- Editor.js como elemento principal
- Layout tipo blog/revista

**Entidades típicas:** Stories, Articles, Blog Posts

**Características:**
- **Casi fullscreen** (mantiene sidebar principal del admin)
- **Enfoque en Editor.js** para contenido rich text
- **Sidebar mínimo** con configuraciones básicas
- **Optimizado para escritura** de contenido largo
- **Featured image** y metadatos de artículo

**Ejemplo de configuración:**
```javascript
editorType: 'story',
editorConfig: {
    title: 'Story Editor',
    fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtitle', type: 'text' },
        { name: 'content', label: 'Content', type: 'editor' },
        { name: 'featured_image', label: 'Featured Image', type: 'file' },
        { name: 'category_id', label: 'Category', type: 'select', options: [...] },
        { name: 'status', label: 'Status', type: 'select', options: [...] }
    ],
    editorConfig: {
        holderId: 'story-content-editor',
        placeholder: 'Tell your story...'
    }
}
```

---

## 🔧 1. Entity Service (API Layer)

### Estructura obligatoria (métodos estandarizados):

```javascript
// src/services/[entity]Service.js
class EntityService {
    constructor() {
        this.baseUrl = '/api/admin/[entities]'; // Plural
    }

    // REQUIRED METHODS (MISMOS NOMBRES EN TODOS LOS SERVICES)
    async makeRequest(endpoint, options = {}) { /* Helper para requests */ }
    async get(params = {}) { /* GET /api/admin/entities (list with pagination) */ }
    async getById(id) { /* GET /api/admin/entities/:id (single entity) */ }
    async create(data) { /* POST /api/admin/entities (create new) */ }
    async update(id, data) { /* PUT /api/admin/entities/:id (update existing) */ }
    async delete(id) { /* DELETE /api/admin/entities/:id (remove) */ }

    // UTILITY METHODS (opcionales según entidad)
    generateSlug(title) { /* ... */ }
    validateEntityData(data) { /* ... */ }
    getDefaultEntityData() { /* ... */ }
    formatEntityForDisplay(entity) { /* ... */ }
}

export default new EntityService();
```

### ⚠️ **INTERFAZ ESTANDARIZADA - OBLIGATORIA:**

| Método | Descripción | Parámetros | Retorna |
|--------|-------------|------------|---------|
| `get()` | Lista entidades con paginación | `{page, limit, search, ...filters}` | `{success, data[], pagination}` |
| `getById()` | Obtiene entidad por ID | `id` | `{success, data}` |
| `create()` | Crea nueva entidad | `entityData` | `{success, data}` |
| `update()` | Actualiza entidad existente | `id, entityData` | `{success, data}` |
| `delete()` | Elimina entidad | `id` | `{success, message}` |

### Parámetros estándar para `get()`:
```javascript
{
    page: 1,          // Número de página
    limit: 20,        // Elementos por página  
    search: '',       // Término de búsqueda
    status: '',       // Filtro por estado
    // ... otros filtros específicos de la entidad
}
```

### Respuesta estándar del backend:
```javascript
{
    success: true,
    data: [...],           // Array de entidades (get) o entidad única (getById, create, update)
    pagination: {          // Solo en get()
        page: 1,
        pages: 5,
        total: 97,
        limit: 20
    }
}
```

---

## 🗂️ 2. Entity Page Component

### Estructura obligatoria:

```javascript
// src/pages/Admin/[Entity]/index.jsx
import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import [entity]Service from '../../../services/[entity]Service';

const [Entity]Page = () => {
    // STATE MANAGEMENT (mismo en todas las entidades)
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const tableRef = useRef(null);

    // API METHODS (mismos nombres en todas las entidades)
    const loadEntities = async (page, limit, search, filters) => {
        // Usar [entity]Service.get()
    }
    const loadEntityForEditing = async (id) => {
        // Usar [entity]Service.getById()
    }
    const saveEntity = async (data, id) => {
        // Usar [entity]Service.create() o [entity]Service.update()
    }
    const deleteEntity = async (id) => {
        // Usar [entity]Service.delete()
    }

    // TABLE CONFIGURATION (específico por entidad)
    const tableConfig = { /* ... */ };

    // UI HANDLERS (mismos en todas las entidades)
    const handleCreateNew = () => { /* ... */ };

    return (
        <div className="content-section">
            <div className="content-header">{/* Header */}</div>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                data={{ data: entities, pagination }}
                                config={tableConfig}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
```

---

## 📊 3. EntityTable Configuration

### Configuración completa:

```javascript
const tableConfig = {
    // BASIC CONFIG
    tableId: '[entity]-table',
    entityType: '[entity]',
    emptyMessage: 'No [entities] found. Create your first [entity]!',
    enableSearch: true,

    // COLUMNS CONFIGURATION
    columns: [
        {
            header: 'Title',
            field: 'title',
            type: 'text' | 'text-with-subtitle' | 'badge' | 'date' | 'custom'
        }
        // ... más columnas
    ],

    // FILTERS CONFIGURATION  
    filters: [
        {
            field: 'status',
            label: 'Status',
            placeholder: 'All Statuses',
            options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
            ]
        }
    ],

    // ACTION HANDLERS
    actionHandlers: {
        delete: (type, id) => deleteEntity(id)
    },
    showViewButton: true,
    viewUrl: (entity) => `/preview/[entity]/${entity.slug}`,
    conditionalDelete: (entity) => !entity.is_system,

    // EVENT HANDLERS (mismos en todas las entidades)
    onSearch: (searchTerm, filters) => loadEntities(1, pageSize, searchTerm, filters),
    onPageChange: (page) => loadEntities(page, pageSize, currentSearch, currentFilters),
    onPageSizeChange: (newPageSize) => loadEntities(1, newPageSize, currentSearch, currentFilters),

    // EDITOR CONFIGURATION ⭐ NUEVO
    editorType: 'page' | 'modal' | 'story',
    editorConfig: { /* ... */ },
    onLoadEntity: loadEntityForEditing,
    onSaveEntity: saveEntity
};
```

### Tipos de columna soportados:

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `text` | Texto simple en negrita | `<strong>Title</strong>` |
| `text-with-subtitle` | Texto con subtítulo | `Title<br><small>slug</small>` |
| `badge` | Badge con color dinámico | `<span class="badge bg-success">Published</span>` |
| `badge-with-color` | Badge con color del campo | `<span style="background: #ff0000">Tag</span>` |
| `user-name` | Nombre completo del usuario | `John Doe` |
| `date` | Fecha formateada | `12/25/2024` |
| `code` | Código con formato | `<code>/page-slug</code>` |
| `system-badge` | Badge para elementos del sistema | `<span class="badge bg-info">System</span>` |
| `custom` | Render personalizado | `render: (entity, value) => { /* ... */ }` |

---

## 🎛️ 4. Editor Configuration

### Configuración de DynamicPage (Fullscreen):

```javascript
editorConfig: {
    title: '[Entity] Editor',
    fields: [
        // MAIN FIELDS (aparecen en el área principal)
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'content', label: 'Content', type: 'editor' },
        
        // PUBLISH PANEL (sidebar)
        { name: 'status', label: 'Status', type: 'select', options: [...] },
        { name: 'template', label: 'Template', type: 'select', options: [...] },
        
        // HIERARCHY PANEL (sidebar)
        { name: 'parent_id', label: 'Parent', type: 'select', options: [...] },
        { name: 'sort_order', label: 'Sort Order', type: 'text' },
        
        // SEO PANEL (sidebar)
        { name: 'slug', label: 'Slug', type: 'text', required: true },
        { name: 'seo_title', label: 'SEO Title', type: 'text' },
        { name: 'meta_description', label: 'Meta Description', type: 'textarea' },
        { name: 'meta_keywords', label: 'Meta Keywords', type: 'text' },
        { name: 'meta_robots', label: 'Meta Robots', type: 'select', options: [...] },
        
        // CUSTOM CSS PANEL (sidebar)
        { name: 'custom_css', label: 'Custom CSS', type: 'textarea', rows: 8 },
        
        // MENU PANEL (sidebar)
        { name: 'show_in_menu', label: 'Show in Menu', type: 'checkbox' },
        { name: 'menu_title', label: 'Menu Title', type: 'text' }
    ],
    editorConfig: {                    // Para campos tipo 'editor'
        holderId: '[entity]-content-editor',
        placeholder: 'Start creating...',
        tools: {}                      // Editor.js tools
    },
    customValidation: (formData) => { 
        // Auto-generate slug if empty
        if (!formData.slug && formData.title) {
            formData.slug = generateSlug(formData.title);
        }
        return {};
    }
}
```

### Auto-agrupación de campos en DynamicPage:

Los campos se agrupan automáticamente por `name` en paneles del sidebar:

| Panel | Campos |
|-------|--------|
| **Main Area** | `title`, `content` |
| **Publish** | `status`, `template` |
| **Hierarchy** | `parent_id`, `sort_order` |
| **SEO** | `slug`, `seo_title`, `meta_title`, `meta_description`, `meta_keywords`, `meta_robots` |
| **Custom CSS** | `custom_css` |
| **Menu** | `show_in_menu`, `menu_title` |
| **Settings** | Cualquier otro campo |

### Tipos de campo soportados:

| Tipo | HTML | Props adicionales |
|------|------|-------------------|
| `text` | `<input type="text">` | `placeholder` |
| `email` | `<input type="email">` | `placeholder` |  
| `url` | `<input type="url">` | `placeholder` |
| `textarea` | `<textarea>` | `rows`, `placeholder` |
| `select` | `<select>` | `options: [{value, label}]` |
| `checkbox` | `<input type="checkbox">` | `checkboxLabel` |
| `editor` | Editor.js | `editorConfig` |
| `custom` | Función render | `render: (value, onChange, formData) => JSX` |

---

## 🔄 5. Data Flow Pattern

### Flujo completo de datos:

```
1. USER INTERACTION
   User clicks "Edit" button in EntityTable
   ↓
2. LOAD ENTITY
   EntityTable → calls onLoadEntity(id)
   → EntityService.getById(id)
   → Backend API GET /api/admin/entities/:id
   ↓
3. OPEN EDITOR
   EntityTable → opens DynamicPage/Modal/Story with entity data
   ↓
4. USER EDITS
   User modifies form fields in Dynamic[Type]
   ↓
5. SAVE ENTITY
   Dynamic[Type] → calls onSave(formData)
   → EntityTable → calls onSaveEntity(formData, id)
   → EntityService.update(id, formData) OR EntityService.create(formData)
   → Backend API PUT /api/admin/entities/:id OR POST /api/admin/entities
   ↓
6. REFRESH TABLE
   EntityTable → calls loadEntities()
   → EntityService.get()
   → Backend API GET /api/admin/entities
```

---

## ✅ 6. Implementation Checklist

### Para implementar una nueva entidad:

#### **Backend (debe existir primero):**
- [ ] Modelo Sequelize creado
- [ ] Rutas CRUD en `/routes/admin/[entity].js`
- [ ] Middleware de permisos configurado
- [ ] API endpoints funcionando

#### **Frontend (implementación):**

**1. Crear Entity Service:**
- [ ] Archivo `src/services/[entity]Service.js`
- [ ] **Métodos CRUD con nombres estándar**: `get()`, `getById()`, `create()`, `update()`, `delete()`
- [ ] Validaciones y utilidades
- [ ] Manejo de errores

**2. Crear Entity Page:**
- [ ] Archivo `src/pages/Admin/[Entity]/index.jsx`
- [ ] Estado de componente configurado (mismo template)
- [ ] **Métodos API usando interfaz estándar**
- [ ] tableConfig completo

**3. Configurar EntityTable:**
- [ ] Columnas definidas correctamente
- [ ] Filtros configurados
- [ ] Acciones implementadas
- [ ] Paginación funcionando

**4. Elegir y configurar Editor:**
- [ ] **Decidir tipo**: `page` (complejo), `modal` (simple), `story` (contenido)
- [ ] Campos definidos en editorConfig
- [ ] Validaciones implementadas
- [ ] Editor.js configurado (si aplica)

**5. Integrar en Admin:**
- [ ] Importar en `src/pages/Admin/index.jsx`
- [ ] Agregar case en `renderCurrentSection()`
- [ ] Probar navegación desde Sidebar

#### **Testing:**
- [ ] Crear entidad nueva
- [ ] Editar entidad existente
- [ ] Eliminar entidad
- [ ] Búsqueda y filtros
- [ ] Paginación
- [ ] Validaciones
- [ ] Manejo de errores

---

## 🚫 Reglas Prohibidas

### ❌ NO hacer:

1. **Cambiar nombres de métodos** - USAR SIEMPRE `get()`, `getById()`, `create()`, `update()`, `delete()`
2. **Hardcodear datos** en los componentes - usar siempre API services
3. **Duplicar lógica de tabla** - usar EntityTable para todas las entidades
4. **Crear editores custom** - usar DynamicPage/Modal/Story
5. **Mezclar tipos de editor** - elegir UNO según complejidad de la entidad
6. **Saltarse validaciones** - implementar tanto frontend como backend
7. **Ignorar paginación** - todas las listas deben paginar
8. **No manejar errores** - siempre try/catch y mensajes user-friendly
9. **Mezclar responsabilidades** - Service solo API, Page solo UI, Table solo tabla

### ✅ Obligatorio:

1. **Seguir naming conventions** estrictamente
2. **Implementar todos los métodos** del service con nombres estándar
3. **Elegir el editor correcto** según complejidad de la entidad
4. **Configurar todas las props** de EntityTable
5. **Validar datos** en frontend Y backend
6. **Manejar estados de loading** siempre
7. **Usar TypeScript/JSDoc** para documentar interfaces
8. **Testear flujo completo** antes de considerar terminado

---

## 🎯 Guía de Decisión: ¿Qué Editor Usar?

```
🤔 ¿Tu entidad tiene...?

📝 POCOS CAMPOS (≤5) + FORMULARIO SIMPLE
   → DynamicModal
   Ejemplos: Users, Categories, Roles, Tags

📄 MUCHOS CAMPOS + CONFIGURACIONES + EDITOR.JS  
   → DynamicPage
   Ejemplos: Pages, Modules, Menus, Settings

📰 CONTENIDO NARRATIVO + EDITOR.JS PRINCIPAL
   → DynamicStory  
   Ejemplos: Stories, Articles, Blog Posts
```

---

## 📚 Ejemplos de Referencia

### Entidad Pages (implementada):
- **Editor Type**: `DynamicPage` ✅
- Service: `src/services/pagesService.js` (usa `get()`, `getById()`, etc.)
- Page: `src/pages/Admin/Pages/index.jsx`
- Backend: `routes/admin/pages.js`

### Próximas entidades a implementar:
- [ ] **Stories** → `DynamicStory` + Editor.js
- [ ] **Users** → `DynamicModal` 
- [ ] **Categories** → `DynamicModal`
- [ ] **Modules** → `DynamicPage` + Editor.js
- [ ] **Menus** → `DynamicPage` + hierarchical data

### Template rápido para nuevo service:

```javascript
// src/services/newEntityService.js
class NewEntityService {
    constructor() {
        this.baseUrl = '/api/admin/newentities';
    }

    async makeRequest(endpoint, options = {}) { /* copiar de pagesService */ }
    async get(params = {}) { /* lista con paginación */ }
    async getById(id) { /* entidad individual */ }
    async create(data) { /* crear nueva */ }
    async update(id, data) { /* actualizar existente */ }
    async delete(id) { /* eliminar */ }
    
    // Utility methods específicos de la entidad...
}

export default new NewEntityService();
```

---

## 🔧 Extensiones Futuras

### Funcionalidades planificadas:
- [ ] Drag & drop sorting en EntityTable
- [ ] Bulk actions (delete multiple)
- [ ] Export/Import CSV
- [ ] Real-time updates con WebSockets
- [ ] Offline support con cache
- [ ] Advanced filters con date ranges
- [ ] Column visibility toggles
- [ ] Saved filter presets

### Componentes adicionales:
- [x] **DynamicPage** (fullscreen con sidebar) ✅
- [ ] **DynamicModal** (para entidades simples)
- [ ] **DynamicStory** (para contenido rich text)
- [ ] EntityTreeTable (para datos jerárquicos)
- [ ] EntityKanban (para workflows)

---

**💡 Este documento debe actualizarse cada vez que se implemente una nueva entidad o se modifiquen los patrones base.** 