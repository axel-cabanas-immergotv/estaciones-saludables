# Website Builder Blocks

Esta carpeta contiene todos los componentes de bloques del Website Builder, organizados por componente individual con sus respectivos estilos CSS.

## Estructura

```
blocks/
├── index.js                 # Exporta todos los componentes
├── CommonStyles.css         # Estilos comunes compartidos entre bloques
├── TextBlock/
│   ├── index.js            # Exporta el componente TextBlock
│   ├── TextBlock.jsx       # Componente React
│   └── TextBlock.css       # Estilos específicos del componente
├── ButtonBlock/
│   ├── index.js
│   ├── ButtonBlock.jsx
│   └── ButtonBlock.css
├── ColumnBlock/
│   ├── index.js
│   ├── ColumnBlock.jsx
│   └── ColumnBlock.css
├── HeadingBlock/
│   ├── index.js
│   ├── HeadingBlock.jsx
│   └── HeadingBlock.css
├── ImageBlock/
│   ├── index.js
│   ├── ImageBlock.jsx
│   └── ImageBlock.css
├── PostsReelBlock/
│   ├── index.js
│   ├── PostsReelBlock.jsx
│   └── PostsReelBlock.css
└── SortableBlock/
    ├── index.js
    ├── SortableBlock.jsx
    └── SortableBlock.css
```

## Uso

### Importar un componente específico:
```javascript
import { TextBlock } from './blocks/TextBlock';
```

### Importar todos los componentes:
```javascript
import { 
  TextBlock, 
  ButtonBlock, 
  ColumnBlock, 
  HeadingBlock, 
  ImageBlock, 
  PostsReelBlock,
  SortableBlock 
} from './blocks';
```

## Estilos

- **CommonStyles.css**: Contiene estilos compartidos como `.block-container`, `.block-header`, `.block-content`, etc.
- **ComponentName.css**: Contiene estilos específicos de cada componente
- Los estilos se importan automáticamente al importar los componentes

## Beneficios de esta organización

1. **Modularidad**: Cada componente tiene sus propios estilos
2. **Mantenibilidad**: Fácil de mantener y modificar componentes individuales
3. **Reutilización**: Los componentes pueden ser reutilizados fácilmente
4. **Escalabilidad**: Fácil agregar nuevos componentes siguiendo la misma estructura
5. **Separación de responsabilidades**: Estilos específicos separados de estilos generales
