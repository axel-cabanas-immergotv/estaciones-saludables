# Web Editor CMS

Un sistema de gestión de contenidos similar a WordPress, construido con Node.js y Vanilla JavaScript.

## Características

- **Backend**: Node.js + Express + Sequelize + PostgreSQL
- **Frontend**: Vanilla JavaScript + Alpine.js + Bootstrap
- **Editor**: Editor.js para contenido enriquecido
- **Autenticación**: JWT con sistema de roles y permisos
- **Arquitectura**: Single Page Application con renderizado client-side
- **SEO**: Server-side rendering para stories individuales
- **Responsive**: Compatible con móviles y escritorio
- **Performance**: Cache Redis para endpoints públicos

## Arquitectura y Convenciones

### Estructura de Componentes

Cada componente del panel de administración sigue una estructura estandarizada:

```
src/admin/[Entity]/
├── index.html      # Componente principal (listado, botones)
├── editor.html     # Formulario de edición
├── view.html       # Visualizador de datos
├── [otros].html    # Templates adicionales (orden alfabético)
└── index.js        # Lógica del componente
```

### Tipos de Formularios de Edición

1. **Modal**: Formularios que aparecen en modal-dialog Bootstrap
   - Ejemplo: Categories
   - Se abren al hacer click en "Editar"

2. **Story**: Formularios que ocupan casi toda la pantalla
   - Ejemplo: Stories
   - Oculta otras secciones, mantiene menú lateral
   - Se renderiza en `story-editor-container`

3. **Page**: Formularios full-screen
   - Ejemplo: Pages
   - Ocupa toda la pantalla
   - Se renderiza en contenedor específico

### Proceso de Build

- Los templates HTML se concatenan en orden específico:
  1. `index.html` (siempre primero)
  2. `editor.html` (siempre segundo)
  3. Otros archivos en orden alfabético
- JavaScript y CSS se minifican usando esbuild
- Un solo archivo compilado para máximo rendimiento

### Convenciones de Código

- **Archivos máximo 400 líneas** (backend) / 500 líneas (frontend)
- **Funcionalidades separadas** en carpetas específicas
- **Editor.js centralizado** en `src/admin/editorConfig.js`
- **Clean URLs** para stories: `/story/mi-primer-story`
- **Componentes reutilizables** altamente configurables

## Estructura del Proyecto

```
web-editor/
├── server.js                 # Servidor principal
├── package.json              # Dependencias del proyecto
├── build.js                  # Script de build para frontend
├── models/                   # Modelos de Sequelize
│   ├── index.js             
│   ├── User.js               # Usuario y autenticación
│   ├── Role.js               # Roles del sistema
│   ├── Permission.js         # Permisos granulares
│   ├── Story.js              # Posts/artículos
│   ├── Page.js               # Páginas del sitio
│   ├── Category.js           # Categorías para stories
│   ├── Module.js             # Header, Footer y módulos
│   ├── Menu.js               # Menús de navegación
│   └── File.js               # Gestión de archivos
├── routes/                   # Rutas del API
│   ├── auth.js               # Autenticación JWT
│   ├── admin.js              # Panel de administración
│   ├── admin/                # Rutas específicas por entidad
│   │   ├── stories.js       
│   │   ├── pages.js         
│   │   ├── categories.js    
│   │   ├── users.js         
│   │   ├── roles.js         
│   │   ├── permissions.js   
│   │   ├── modules.js       
│   │   └── menus.js         
│   ├── public.js             # API pública
│   ├── story.js              # Rutas para stories individuales
│   └── upload.js             # Subida de archivos
├── middleware/               # Middleware de autenticación
│   └── auth.js              
├── migrations/               # Migraciones de base de datos
├── seeds/                    # Datos iniciales
│   └── defaultData.js       
├── src/                      # Código fuente del frontend
│   ├── public/               # Sitio público
│   │   ├── index.html       # Página principal
│   │   ├── story.html       # Template para stories
│   │   ├── main.js          # Lógica del sitio público
│   │   └── story.js         # Lógica para stories
│   ├── admin/                # Panel de administración
│   │   ├── admin-template.html
│   │   ├── admin.js         # Controlador principal
│   │   ├── editorConfig.js  # Configuración centralizada Editor.js
│   │   ├── Stories/         # Componente Stories
│   │   ├── Pages/           # Componente Pages
│   │   ├── Categories/      # Componente Categories
│   │   ├── Users/           # Componente Users
│   │   ├── Roles/           # Componente Roles
│   │   ├── Permissions/     # Componente Permissions
│   │   ├── Modules/         # Componente Modules
│   │   ├── Menus/           # Componente Menus
│   │   └── utils/           # Utilities compartidas
│   │       ├── tableComponent.js
│   │       └── dropzone.js
│   ├── auth/                 # Página de login
│   ├── editorjs/             # Plugins personalizados Editor.js
│   │   ├── storiesreel/     # Widget Stories Carousel
│   │   ├── columns/         # Plugin de columnas
│   │   └── advunit/         # Widget publicitario
│   └── styles/               # Archivos CSS
│       ├── admin.css        # Estilos del admin (WordPress-like)
│       └── main.css         # Estilos del sitio público
└── dist/                     # Archivos compilados (generados)
```

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd web-editor
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar migraciones**
   ```bash
   npm run migrate
   ```

4. **Compilar el frontend**
   ```bash
   npm run build
   ```

5. **Iniciar el servidor**
   ```bash
   npm run dev
   ```

6. **Acceder a la aplicación**
   - Sitio público: http://localhost:3000
   - Panel de administración: http://localhost:3000/admin
   - Login: http://localhost:3000/login

## Configuración de Base de Datos

El sistema usa PostgreSQL exclusivamente. La configuración se realiza a través del archivo `.env`.

### Configuración PostgreSQL

```bash
# .env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=web_editor_cms
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

### Inicialización de Base de Datos

1. **Crear base de datos**: Crear la base de datos en PostgreSQL
2. **Ejecutar migraciones**: `npm run migrate`
3. **Cargar datos iniciales**: `npm run seed`
4. **Iniciar el servidor**: `npm run dev`

**Nota**: Las migraciones son compatibles con ambas bases de datos automáticamente.

## Credenciales por Defecto

- **Email**: admin@webeditor.com
- **Password**: admin123

## Funcionalidades Principales

### Sitio Público
- Páginas dinámicas con Editor.js
- Stories/artículos con categorías
- Widgets personalizados (Stories Carousel, Menu)
- Módulos Header y Footer
- SEO optimizado para stories

### Panel de Administración
- Dashboard con estadísticas
- Gestión de Pages y Stories
- Sistema de categorías
- Gestión de usuarios y roles
- Configuración de módulos
- Editor visual con Editor.js

### Sistema de Permisos
- Roles: Admin, Editor, Author, Viewer
- Permisos granulares por entidad y acción
- Control de acceso basado en roles
- Propiedad de contenido (users can edit their own content)

## Entidades del Sistema

### Pages (Páginas)
- **Propósito**: Layouts que definen cómo se muestran las stories
- **Editor**: Editor.js con widgets personalizados
- **Rutas built-in**: `/home`, `/story/:id`
- **Tipo de formulario**: Page (full-screen)

### Stories (Artículos/Posts)
- **Propósito**: Contenido principal del sitio
- **Campos**: título, subtítulo, body, categoría, autor, imagen
- **Editor**: Editor.js para contenido enriquecido
- **SEO**: Meta tags server-side para `/story/:slug`
- **Tipo de formulario**: Story (casi full-screen)

### Modules (Módulos)
- **Built-in**: Header, Footer
- **Propósito**: Contenido que siempre se muestra
- **Editor**: Editor.js con widgets personalizados
- **Estructura**: Header → Page → Footer

### Menus (Menús)
- **Propósito**: Navegación del sitio
- **Características**: Jerárquico (multinivel), responsive
- **Integración**: Widget personalizado para Editor.js
- **Soporte**: Megamenu con contenido Editor.js

### Categories (Categorías)
- **Propósito**: Clasificación de stories
- **Uso**: Filtrado en widgets Stories Carousel
- **Tipo de formulario**: Modal

### Users, Roles, Permissions (Sistema de Usuarios)
- **Granularidad**: Por entidad y acción (CREAR, EDITAR, ACTUALIZAR, BORRAR, etc.)
- **Roles predefinidos**: Admin, Editor, Author, Viewer
- **Propiedad**: Los usuarios pueden editar su propio contenido

## Widgets Personalizados de Editor.js

### Stories Carousel
- **Propósito**: Mostrar colección de stories en formato carrusel
- **Configuración**: Número de items, filtro por categoría
- **Responsive**: Adaptable a móvil y escritorio

### Menu Widget
- **Propósito**: Insertar menús de navegación
- **Características**: Multinivel, responsive, megamenu
- **Configuración**: Selección de menú creado

### Columns
- **Propósito**: Crear layouts de columnas
- **Uso**: Organizar contenido en múltiples columnas

### AdvUnit
- **Propósito**: Espacios publicitarios
- **Configuración**: Tamaño, posición, contenido

## Sistema de Permisos Granular

### Acciones por Entidad
- **CREAR**: Crear nuevas instancias
- **EDITAR**: Modificar cualquier instancia
- **ACTUALIZAR**: Actualizar datos
- **BORRAR**: Eliminar cualquier instancia
- **BORRAR_PROPIO**: Eliminar solo contenido propio
- **ACTUALIZAR_PROPIO**: Actualizar solo contenido propio

### Roles Predefinidos
- **Admin**: Acceso completo a todo el sistema
- **Editor**: Gestión de contenido y usuarios limitados
- **Author**: Creación y gestión de contenido propio
- **Viewer**: Solo lectura

## Componentes Dinámicos y Campos Personalizados

### Arquitectura de Campos Personalizados

El sistema incluye tres componentes dinámicos que soportan campos personalizados avanzados:

1. **DynamicModal** - Modal-based editing para formularios simples
2. **DynamicStory** - Full-screen story editing con sidebar
3. **DynamicPage** - Full-screen page editing con sidebar

### Tipos de Campos Personalizados

#### 1. Función de Renderizado (Recomendado)
```javascript
{
    name: 'members',
    label: 'Affiliate Members',
    type: 'custom',
    render: (value, onChange, formData) => (
        <AffiliateMembers
            value={value}
            onChange={onChange}
            affiliateId={formData.id}
        />
    )
}
```

#### 2. Referencia a Componente
```javascript
{
    name: 'members',
    label: 'Affiliate Members',
    type: 'custom',
    component: AffiliateMembers,
    props: { affiliateId: formData.id }
}
```

#### 3. Elemento Pre-renderizado (Legacy)
```javascript
{
    name: 'members',
    label: 'Affiliate Members',
    type: 'custom',
    element: <AffiliateMembers affiliateId={formData.id} />
}
```

#### 4. Renderizado Condicional
```javascript
{
    name: 'premium_features',
    label: 'Premium Features',
    type: 'custom',
    show: (formData, field) => formData.type === 'premium',
    render: (value, onChange, formData) => <PremiumFeatures />
}
```

#### 5. Campo Personalizado Avanzado con Props
```javascript
{
    name: 'advanced_widget',
    label: 'Advanced Widget',
    type: 'custom',
    component: AdvancedWidget,
    props: { 
        theme: 'dark',
        size: 'large',
        onCustomEvent: (data) => console.log(data)
    }
}
```

### Ejemplos por Componente

#### DynamicModal - Gestión de Afiliados
```javascript
// En configuración de Affiliates
{
    name: 'members',
    label: 'Affiliate Members',
    type: 'custom',
    show: (formData) => !!formData.id, // Solo mostrar al editar
    render: (value, onChange, formData) => (
        <AffiliateMembers
            affiliateId={formData.id}
            affiliateName={formData.name}
            members={members}
            availableMembers={availableMembers}
            onAddMember={addMember}
            onUpdatePermissions={updateMemberPermissions}
            onRemoveMember={removeMember}
            permissionOptions={affiliatesService.getPermissionOptions()}
        />
    )
}
```

#### DynamicStory - Carga de Imágenes Destacadas
```javascript
// En configuración de Stories
{
    name: 'featured_image',
    label: 'Featured Image',
    type: 'custom',
    render: (value, onChange, formData) => (
        <ImageUploader
            value={value}
            onChange={onChange}
            storyId={formData.id}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxSize={5 * 1024 * 1024} // 5MB
        />
    )
}
```

#### DynamicPage - Constructor de Páginas
```javascript
// En configuración de Pages
{
    name: 'page_builder',
    label: 'Page Builder',
    type: 'custom',
    show: (formData) => formData.template === 'custom',
    render: (value, onChange, formData) => (
        <PageBuilder
            value={value}
            onChange={onChange}
            pageId={formData.id}
            availableBlocks={getAvailableBlocks(formData.type)}
            theme={formData.theme}
        />
    )
}
```

### Patrones Avanzados

#### Campos Condicionales Basados en Otros Campos
```javascript
{
    name: 'seo_settings',
    label: 'SEO Settings',
    type: 'custom',
    show: (formData) => formData.status === 'published',
    render: (value, onChange, formData) => (
        <SEOSettings
            value={value}
            onChange={onChange}
            pageTitle={formData.title}
            pageSlug={formData.slug}
        />
    )
}
```

#### Props Dinámicas Basadas en Datos del Formulario
```javascript
{
    name: 'template_selector',
    label: 'Template',
    type: 'custom',
    component: TemplateSelector,
    props: (formData) => ({
        category: formData.category,
        theme: formData.theme || 'default',
        onTemplateChange: (template) => {
            onChange(template);
            // También puedes actualizar otros campos aquí
        }
    })
}
```

#### Campos Personalizados Multi-paso
```javascript
{
    name: 'wizard_setup',
    label: 'Setup Wizard',
    type: 'custom',
    render: (value, onChange, formData) => (
        <SetupWizard
            value={value}
            onChange={onChange}
            currentStep={formData.setupStep || 1}
            totalSteps={3}
            onStepComplete={(step, data) => {
                onChange({ ...value, [step]: data });
            }}
        />
    )
}
```

### Mejores Prácticas

#### 1. Performance
```javascript
// Bueno: Memoizar campos personalizados costosos
const MemoizedCustomField = React.memo(CustomField);

// En tu configuración:
{
    name: 'expensive_field',
    type: 'custom',
    component: MemoizedCustomField
}
```

#### 2. Manejo de Estado
```javascript
// Bueno: Usar estado local para interacciones complejas
const CustomField = ({ value, onChange, formData }) => {
    const [localState, setLocalState] = useState(value);
    
    const handleSave = () => {
        onChange(localState);
    };
    
    return (
        <div>
            {/* Tu UI personalizada */}
            <button onClick={handleSave}>Save Changes</button>
        </div>
    );
};
```

#### 3. Manejo de Errores
```javascript
// Bueno: Manejar errores graciosamente
{
    name: 'api_field',
    type: 'custom',
    render: (value, onChange, formData) => (
        <APIDrivenField
            value={value}
            onChange={onChange}
            onError={(error) => {
                console.error('Custom field error:', error);
                // Mostrar mensaje de error amigable
            }}
        />
    )
}
```

### Migración desde customRender

#### Antes (solo DynamicModal)
```javascript
editorConfig: {
    customRender: (formData, onChange, isEditing) => {
        if (!isEditing) return null;
        return <AffiliateMembers affiliateId={formData.id} />;
    }
}
```

#### Después (Todos los Componentes Dinámicos)
```javascript
fields: [
    // ... otros campos
    {
        name: 'members',
        label: 'Affiliate Members',
        type: 'custom',
        show: (formData) => !!formData.id,
        render: (value, onChange, formData) => (
            <AffiliateMembers affiliateId={formData.id} />
        )
    }
]
```

### Consideraciones por Componente

- **DynamicModal**: Campos compactos, manejo de scroll, gestión de foco
- **DynamicStory**: Integración con sidebar, enfoque en contenido, responsive
- **DynamicPage**: Espacio completo, organización en paneles, integración con Editor.js

### Casos de Uso Comunes

- **Gestión de miembros** (afiliados, usuarios)
- **Carga de archivos** (imágenes, documentos)
- **Configuraciones SEO** (meta tags, sitemap)
- **Matrices de permisos** (roles, accesos)
- **Selectores de contenido relacionado** (tags, categorías)
- **Widgets de información** (contacto, estadísticas)
- **Constructores visuales** (páginas, layouts)
- **Wizards de configuración** (setup, onboarding)

### Troubleshooting y Debugging

#### Problemas Comunes

1. **Campo no se renderiza**
   ```javascript
   // Verificar función show
   show: (formData) => {
       console.log('Form data:', formData);
       return !!formData.id; // Asegurar que retorne boolean
   }
   ```

2. **Props no se pasan correctamente**
   ```javascript
   // Verificar estructura de props
   props: (formData) => {
       console.log('Props function called with:', formData);
       return { 
           id: formData.id,
           name: formData.name 
       };
   }
   ```

3. **Componente no se encuentra**
   ```javascript
   // Verificar importación
   import { MyComponent } from './MyComponent';
   
   // En configuración
   component: MyComponent // No MyComponent()
   ```

4. **Estado no se actualiza**
   ```javascript
   // Verificar callback onChange
   render: (value, onChange, formData) => (
       <MyComponent 
           value={value}
           onChange={(newValue) => {
               console.log('New value:', newValue);
               onChange(newValue);
           }}
       />
   )
   ```

#### Tips de Debug

- Agregar `console.log` en funciones `render`, `show` y `props`
- Verificar valores de `formData` en cada renderizado
- Probar lógica condicional independientemente
- Verificar que `onChange` se llame con el valor correcto

### Casos de Uso Avanzados

#### Campo con Validación Personalizada
```javascript
{
    name: 'complex_field',
    label: 'Complex Field',
    type: 'custom',
    render: (value, onChange, formData) => (
        <ComplexField
            value={value}
            onChange={onChange}
            onValidate={(data) => {
                const errors = validateComplexData(data);
                if (errors.length > 0) {
                    // Mostrar errores en el campo
                    return false;
                }
                return true;
            }}
        />
    )
}
```

#### Campo con Estado Local y Sincronización
```javascript
{
    name: 'async_field',
    label: 'Async Field',
    type: 'custom',
    render: (value, onChange, formData) => {
        const [localValue, setLocalValue] = useState(value);
        const [syncing, setSyncing] = useState(false);
        
        const handleSync = async () => {
            setSyncing(true);
            try {
                const result = await syncWithAPI(localValue);
                onChange(result);
                setSyncing(false);
            } catch (error) {
                setSyncing(false);
                // Manejar error
            }
        };
        
        return (
            <div>
                <AsyncField 
                    value={localValue}
                    onChange={setLocalValue}
                    onSync={handleSync}
                    syncing={syncing}
                />
            </div>
        );
    }
}
```

#### Campo con Dependencias entre Campos
```javascript
{
    name: 'dependent_field',
    label: 'Dependent Field',
    type: 'custom',
    render: (value, onChange, formData) => (
        <DependentField
            value={value}
            onChange={onChange}
            dependencies={{
                category: formData.category,
                status: formData.status,
                type: formData.type
            }}
            onDependencyChange={(field, newValue) => {
                // Actualizar campo dependiente en el formulario principal
                // Esto requiere acceso al contexto del formulario
            }}
        />
    )
}
```

#### Campo con Integración de Terceros
```javascript
{
    name: 'third_party_widget',
    label: 'Third Party Widget',
    type: 'custom',
    render: (value, onChange, formData) => (
        <ThirdPartyWidget
            apiKey={process.env.THIRD_PARTY_API_KEY}
            value={value}
            onChange={onChange}
            config={{
                theme: formData.theme || 'light',
                language: formData.language || 'en',
                region: formData.region || 'US'
            }}
            onLoad={() => console.log('Widget loaded')}
            onError={(error) => console.error('Widget error:', error)}
        />
    )
}
```

### Resumen de la Arquitectura

La nueva arquitectura de campos personalizados proporciona:

- **Consistencia**: Misma API en todos los componentes dinámicos
- **Flexibilidad**: Múltiples enfoques para diferentes necesidades
- **Mantenibilidad**: Mejor separación de responsabilidades
- **Reutilización**: Componentes compartibles entre entidades
- **Escalabilidad**: Fácil agregar nuevos tipos de campos
- **Performance**: Optimizaciones específicas por componente

### Referencias y Recursos

- **Componentes**: `src/components/DynamicModal/`, `src/components/DynamicStory/`, `src/components/DynamicPage/`
- **Ejemplo de Implementación**: Ver `src/pages/Admin/Affiliates/index.jsx` para uso real
- **Patrones**: Usar `render` para lógica compleja, `component` para reutilización, `show` para visibilidad condicional
- **Testing**: Probar campos personalizados en aislamiento antes de integrar
- **Performance**: Memoizar componentes costosos y optimizar re-renders

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Verificar autenticación

### Administración
- `GET /api/admin/stories` - Listar stories
- `GET /api/admin/pages` - Listar páginas
- `GET /api/admin/categories` - Listar categorías
- `GET /api/admin/users` - Listar usuarios

### Público
- `GET /api/public/stories` - Stories publicadas
- `GET /api/public/pages/:slug` - Página por slug
- `GET /api/public/modules` - Módulos activos

## Tecnologías Utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **Sequelize**: ORM para base de datos
- **PostgreSQL**: Base de datos
- **JWT**: Autenticación
- **bcryptjs**: Hash de contraseñas
- **Helmet**: Seguridad HTTP

### Frontend
- **Vanilla JavaScript**: Sin frameworks pesados
- **Alpine.js**: Reactividad ligera
- **Bootstrap 5**: Framework CSS
- **Editor.js**: Editor de contenido
- **Font Awesome**: Iconos
- **esbuild**: Bundler y minificador

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Compilar frontend
- `npm start` - Ejecutar en modo producción
- `npm run migrate` - Ejecutar migraciones
- `npm run seed` - Cargar datos iniciales

## Desarrollo Avanzado

### Agregar Nuevos Componentes de Admin

1. **Crear estructura de carpeta**:
   ```
   src/admin/[NuevoComponente]/
   ├── index.html      # Listado y botones principales
   ├── editor.html     # Formulario de edición
   ├── view.html       # Visualizador
   └── index.js        # Lógica Alpine.js
   ```

2. **Seguir convenciones**:
   - Máximo 500 líneas por archivo
   - Usar Alpine.js para reactividad
   - Reutilizar `tableComponent.js` para listados
   - Implementar el tipo de formulario apropiado

3. **Integrar en build**: El sistema automáticamente incluirá los templates

### Agregar Nuevos Widgets de Editor.js

1. **Crear en `src/editorjs/[widget-name]/`**:
   ```
   ├── index.js           # Exportación principal
   ├── config.js          # Configuración del widget
   ├── integration.js     # Integración con Editor.js
   ├── [widget]-global.js # Lógica global
   └── [widget].css       # Estilos específicos
   ```

2. **Registrar en `editorConfig.js`**:
   ```javascript
   import MyWidget from '../editorjs/mywidget/index.js';
   
   // En tools:
   mywidget: MyWidget
   ```

3. **Implementar renderizado en `main.js`**:
   ```javascript
   case 'mywidget':
     return renderMyWidget(block.data);
   ```

### Extender Sistema de Permisos

1. **Agregar nuevos permisos en `seeds/defaultData.js`**:
   ```javascript
   { name: 'nueva_entidad_crear', description: 'Create nueva entidad' }
   ```

2. **Asignar a roles según necesidad**

3. **Implementar verificación en rutas**:
   ```javascript
   router.get('/', authMiddleware, checkPermission('nueva_entidad_leer'), ...);
   ```

### Convenciones de Nomenclatura

- **Archivos**: camelCase para JavaScript, kebab-case para CSS
- **Variables**: Inglés, camelCase
- **Comentarios**: Inglés en código
- **UI/Mensajes**: Español para usuario final
- **Rutas**: Clean URLs, kebab-case

## Performance y Optimización

### Frontend
- **Un solo archivo JS/CSS**: Compilación con esbuild
- **Client-side rendering**: Excepto stories individuales
- **Cache del navegador**: Assets con versionado
- **Alpine.js**: Reactividad ligera sin virtual DOM

### Backend
- **Cache Redis**: Endpoints públicos
- **Compresión**: Middleware gzip
- **Helmet**: Headers de seguridad
- **Rate limiting**: Protección contra spam

## Licencia

MIT License 