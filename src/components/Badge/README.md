# Badge Component

Un componente genérico y reutilizable para mostrar badges con múltiples variantes, tamaños y funcionalidades.

## Características

- ✅ Múltiples variantes de color (primary, secondary, success, danger, warning, info, light, dark)
- ✅ Variantes outline para cada color
- ✅ Tres tamaños diferentes (sm, md, lg)
- ✅ Soporte para iconos FontAwesome
- ✅ Badges clickeables con efectos hover
- ✅ Posicionamiento de iconos (izquierda o derecha)
- ✅ Bordes redondeados o cuadrados
- ✅ Accesibilidad completa (ARIA, teclado)
- ✅ Responsive design
- ✅ Estilos CSS modulares
- ✅ Tooltips personalizables

## Uso Básico

```jsx
import Badge from '../Badge';

// Badge simple
<Badge text="Nuevo" variant="success" />

// Badge con icono
<Badge 
    text="Usuario" 
    variant="primary" 
    icon="fa-user" 
/>

// Badge clickeable
<Badge 
    text="Click me" 
    variant="danger" 
    clickable={true}
    onClick={() => console.log('Clicked!')}
/>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `text` | string | `''` | Texto a mostrar en el badge |
| `variant` | string | `'primary'` | Variante de color del badge |
| `size` | string | `'md'` | Tamaño del badge |
| `icon` | string | `null` | Clase de icono FontAwesome |
| `clickable` | boolean | `false` | Si el badge es clickeable |
| `onClick` | function | `null` | Función a ejecutar al hacer clic |
| `title` | string | `''` | Texto del tooltip |
| `className` | string | `''` | Clases CSS adicionales |
| `style` | object | `{}` | Estilos inline adicionales |
| `outline` | boolean | `false` | Si usar variante outline |
| `rounded` | boolean | `true` | Si usar bordes redondeados |
| `iconPosition` | string | `'left'` | Posición del icono |

## Variantes de Color

### Sólidas
- `primary` - Azul
- `secondary` - Gris
- `success` - Verde
- `danger` - Rojo
- `warning` - Amarillo
- `info` - Cian
- `light` - Blanco
- `dark` - Negro

### Outline
- `outline-primary` - Azul con borde
- `outline-secondary` - Gris con borde
- `outline-success` - Verde con borde
- `outline-danger` - Rojo con borde
- `outline-warning` - Amarillo con borde
- `outline-info` - Cian con borde
- `outline-light` - Blanco con borde
- `outline-dark` - Negro con borde

## Tamaños

- `sm` - Pequeño (0.75rem)
- `md` - Mediano (0.875rem) - Default
- `lg` - Grande (1rem)

## Ejemplos de Uso

### Badges Básicos

```jsx
// Badge simple
<Badge text="Activo" variant="success" />

// Badge con icono
<Badge 
    text="Usuario" 
    variant="primary" 
    icon="fa-user" 
/>

// Badge outline
<Badge 
    text="Pendiente" 
    variant="warning" 
    outline={true}
/>
```

### Badges Clickeables

```jsx
// Badge clickeable simple
<Badge 
    text="Ver detalles" 
    variant="info" 
    clickable={true}
    onClick={() => handleViewDetails()}
/>

// Badge clickeable con icono
<Badge 
    text="Editar" 
    variant="primary" 
    icon="fa-edit"
    clickable={true}
    onClick={() => handleEdit()}
    title="Click para editar"
/>
```

### Badges con Iconos

```jsx
// Icono a la izquierda (default)
<Badge 
    text="Fiscal" 
    variant="success" 
    icon="fa-user-tie" 
/>

// Icono a la derecha
<Badge 
    text="Admin" 
    variant="danger" 
    icon="fa-shield-alt"
    iconPosition="right"
/>
```

### Badges Personalizados

```jsx
// Badge cuadrado
<Badge 
    text="Tag" 
    variant="secondary" 
    rounded={false}
/>

// Badge con estilos personalizados
<Badge 
    text="Custom" 
    variant="primary" 
    className="my-custom-class"
    style={{ marginLeft: '10px' }}
/>

// Badge pequeño con icono
<Badge 
    text="Nuevo" 
    variant="success" 
    size="sm"
    icon="fa-star"
/>
```

## Casos de Uso Comunes

### Lista de Fiscales
```jsx
{fiscales.map((fiscal, index) => (
    <Badge
        key={index}
        text={`${fiscal.user.first_name} ${fiscal.user.last_name}`}
        variant="success"
        icon="fa-user-tie"
        clickable={true}
        onClick={() => handleFiscalClick(fiscal.user)}
        title="Click para ver detalles del fiscal"
    />
))}
```

### Estados de Usuario
```jsx
<Badge 
    text={user.status === 'active' ? 'Activo' : 'Inactivo'}
    variant={user.status === 'active' ? 'success' : 'secondary'}
    icon={user.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'}
/>
```

### Etiquetas de Categoría
```jsx
<Badge 
    text={category.name}
    variant="info"
    outline={true}
    size="sm"
/>
```

## Accesibilidad

El componente Badge incluye soporte completo para accesibilidad:

- **ARIA roles**: Los badges clickeables tienen `role="button"`
- **Navegación por teclado**: Soporte para Enter y Espacio
- **Focus management**: Indicadores visuales de foco
- **Screen readers**: Texto descriptivo y tooltips

## Estilos CSS

El componente incluye estilos CSS modulares que se pueden personalizar:

- Variables CSS para colores
- Efectos hover y focus
- Transiciones suaves
- Responsive design
- Animaciones opcionales

## Migración desde Badges Existentes

Para migrar badges existentes al nuevo componente:

```jsx
// Antes
<span className="badge bg-success clickable-tag">
    <i className="fas fa-user-tie me-1"></i>
    {fiscal.user.first_name} {fiscal.user.last_name}
</span>

// Después
<Badge
    text={`${fiscal.user.first_name} ${fiscal.user.last_name}`}
    variant="success"
    icon="fa-user-tie"
    clickable={true}
    onClick={() => handleFiscalClick(fiscal.user)}
    title="Click para ver detalles del fiscal"
/>
```
