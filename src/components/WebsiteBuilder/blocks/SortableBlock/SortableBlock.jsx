import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// import { BlockRenderer } from './BlockRenderer';
import { BlockRenderer } from '../../BlockRenderer';

const SortableBlock = ({ 
  block, 
  onBlockUpdate, 
  onBlockDelete, 
  isEditing,
  index,
  allBlocks = []
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Calculate width for column blocks based on their props
  const getColumnWidth = () => {
    if (block.type === 'column' && block.props && block.props.width) {
      const columnWidth = block.props.width;
      return `${(columnWidth / 12) * 100}%`;
    }
    return 'auto';
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
    // For column blocks, don't take full width and use calculated width
    display: block.type === 'column' ? 'inline-block' : 'block',
    width: block.type === 'column' ? getColumnWidth() : '100%',
    verticalAlign: block.type === 'column' ? 'top' : 'baseline'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`sortable-block ${block.type === 'column' ? 'sortable-column' : ''}`}
      data-dragging={isDragging}
    >
      {/* Drag Handle - Only this is draggable */}
      <div 
        className="drag-handle"
        {...listeners}
      >
        <div className="drag-indicator">
          <span>⋮⋮</span>
        </div>
      </div>
      
      {/* Block Content - Not draggable */}
      <BlockRenderer
        block={block}
        onBlockUpdate={onBlockUpdate}
        onBlockDelete={onBlockDelete}
        isEditing={isEditing}
        parentBlocks={allBlocks}
      />
    </div>
  );
};

export default SortableBlock;
