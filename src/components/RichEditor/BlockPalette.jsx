import React from 'react';
import './BlockPalette.css';

const BlockPalette = ({ blocks = [], onBlockSelect }) => {
  const handleDragStart = (e, block) => {
    e.dataTransfer.setData('text/block-type', block.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleBlockClick = (block) => {
    if (onBlockSelect) {
      onBlockSelect(block);
    }
  };

  return (
    <div className="block-palette">
      <div className="block-palette-header">
        <h6 className="block-palette-title">Content Blocks</h6>
        <p className="block-palette-subtitle">Drag and drop blocks into your content</p>
      </div>
      
      <div className="block-palette-grid">
        {blocks.map((block) => (
          <div
            key={block.type}
            className="block-item"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, block)}
            onClick={() => handleBlockClick(block)}
            title={`Drag ${block.label} into your content`}
          >
            <div className="block-icon">
              {block.icon}
            </div>
            <div className="block-label">
              {block.label}
            </div>
          </div>
        ))}
      </div>
      
      {blocks.length === 0 && (
        <div className="block-palette-empty">
          <p className="text-muted">No blocks available</p>
        </div>
      )}
    </div>
  );
};

export default BlockPalette;
