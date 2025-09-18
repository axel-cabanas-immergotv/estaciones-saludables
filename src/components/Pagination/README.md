# Componente Pagination

Componente genérico de paginación reutilizable para mostrar navegación de páginas y selector de tamaño de página.

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `pagination` | Object | Sí | - | Objeto con información de paginación |
| `onPageChange` | Function | Sí | - | Callback cuando cambia la página |
| `onPageSizeChange` | Function | No | - | Callback cuando cambia el tamaño de página |
| `className` | String | No | '' | Clases CSS adicionales |
| `showPageSizeSelector` | Boolean | No | true | Mostrar selector de tamaño de página |
| `pageSizeOptions` | Array | No | [10, 20, 50, 100] | Opciones de tamaño de página |

## Estructura del objeto `pagination`

```javascript
{
  page: 1,        // Página actual
  pages: 10,      // Total de páginas
  total: 100,     // Total de elementos
  limit: 10       // Elementos por página
}
```

## Ejemplo de uso

```jsx
import Pagination from '../Pagination';

const MyComponent = () => {
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 5,
    total: 50,
    limit: 10
  });

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Hacer la petición con la nueva página
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: newSize, 
      page: 1 // Reset a primera página
    }));
    // Hacer la petición con el nuevo tamaño
  };

  return (
    <div>
      {/* Tu contenido aquí */}
      
      <Pagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        className="my-custom-class"
      />
    </div>
  );
};
```

## Características

- **Responsive**: Se adapta a pantallas móviles
- **Accesible**: Incluye títulos descriptivos en botones
- **Personalizable**: Permite clases CSS adicionales
- **Flexible**: Selector de tamaño de página opcional
- **Optimizado**: Solo se renderiza si hay más de una página

## Comportamiento

- No se renderiza si hay una página o menos
- Muestra máximo 5 números de página visibles
- Incluye botones para primera, anterior, siguiente y última página
- Deshabilita botones apropiados en los extremos
- Traducido al español
