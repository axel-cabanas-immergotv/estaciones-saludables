# AddBlockButton Component

Un componente reutilizable que proporciona un dropdown para agregar bloques al Website Builder.

## Características

- Dropdown con lista de bloques disponibles
- Iconos y etiquetas para cada tipo de bloque
- Personalizable (texto, tipo, tamaño, estado)
- Estilos CSS específicos incluidos
- Responsive design

## Uso

```jsx
import AddBlockButton from './AddBlockButton';

// Uso básico
<AddBlockButton
  availableBlocks={availableBlocks}
  onAddBlock={handleAddBlock}
/>

// Uso con props personalizadas
<AddBlockButton
  availableBlocks={availableBlocks}
  onAddBlock={handleAddBlock}
  buttonText="Agregar Bloque"
  buttonType="primary"
  size="large"
  disabled={false}
/>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `availableBlocks` | `Array` | - | Array de bloques disponibles con `type`, `icon`, y `label` |
| `onAddBlock` | `Function` | - | Función callback que se ejecuta cuando se selecciona un bloque |
| `buttonText` | `String` | `"Add Block"` | Texto del botón |
| `buttonType` | `String` | `"default"` | Tipo de botón de Ant Design (`default`, `primary`, `dashed`, etc.) |
| `size` | `String` | `"middle"` | Tamaño del botón (`small`, `middle`, `large`) |
| `disabled` | `Boolean` | `false` | Si el botón está deshabilitado |

## Estructura de availableBlocks

```javascript
const availableBlocks = [
  {
    type: 'text',
    icon: '📝',
    label: 'Text Block'
  },
  {
    type: 'heading',
    icon: '📋',
    label: 'Heading Block'
  },
  // ... más bloques
];
```

## Estilos

El componente incluye estilos CSS específicos para:
- Animaciones de hover
- Estilos del dropdown
- Diseño responsive
- Iconos y etiquetas

## Ejemplo de implementación

```jsx
const handleAddBlock = (blockType) => {
  const newBlock = {
    id: `block-${Date.now()}`,
    type: blockType,
    props: getDefaultBlockProps(blockType)
  };
  
  // Agregar el bloque a tu estado
  setBlocks(prev => [...prev, newBlock]);
};

<AddBlockButton
  availableBlocks={availableBlocks}
  onAddBlock={handleAddBlock}
  buttonText="Add Block"
  buttonType="default"
/>
```
