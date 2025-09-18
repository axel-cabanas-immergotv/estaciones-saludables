import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm } from 'antd';
import { DeleteOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
// import { BlockRenderer } from '../BlockRenderer';
import { BlockRenderer } from '../../BlockRenderer';
import AddBlockButton from '../../AddBlockButton';

const ColumnBlock = ({ block, onUpdate, onDelete, isEditing = false, onBlockUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const props = block.props || {};
  const children = block.children || [];

  // Simple width calculation for Bootstrap-like grid
  const getColumnStyle = () => {
    const columnWidth = props.width || 12;
    return {
      width: `${(columnWidth / 12) * 100}%`,
      display: 'inline-block',
      verticalAlign: 'top',
      boxSizing: 'border-box'
    };
  };

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    
    // Update the current block's props using onBlockUpdate
    if (onBlockUpdate) {
      onBlockUpdate(block.id, { props: updatedProps });
    }
  };

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: blockType,
      props: getDefaultProps(blockType),
      order: children.length,
      children: []
    };

    const updatedChildren = [...children, newBlock];
    onUpdate?.(block.id, { children: updatedChildren });
  };

  const getDefaultProps = (blockType) => {
    switch (blockType) {
      case 'text':
        return {
          content: 'New text block',
          fontSize: 16,
          fontWeight: 'normal',
          color: '#333',
          textAlign: 'left'
        };
      case 'image':
        return {
          src: 'https://picsum.photos/400/300',
          alt: 'New image',
          width: 400,
          height: 300,
          borderRadius: 0,
          objectFit: 'cover'
        };
      case 'posts-reel':
        return {
          category: 'featured',
          limit: 3,
          showExcerpt: true,
          showImage: true,
          layout: 'vertical'
        };
      case 'heading':
        return {
          text: 'New heading',
          level: 2,
          color: '#333',
          textAlign: 'left'
        };
      case 'button':
        return {
          text: 'Click me',
          url: '#',
          variant: 'primary',
          size: 'medium'
        };
      default:
        return {};
    }
  };

  const handleBlockUpdate = (blockId, updates) => {
    const updatedChildren = children.map(child =>
      child.id === blockId ? { ...child, ...updates } : child
    );
    onUpdate?.(block.id, { children: updatedChildren });
  };

  const handleBlockDelete = (blockId) => {
    const updatedChildren = children.filter(child => child.id !== blockId);
    onUpdate?.(block.id, { children: updatedChildren });
  };

  const columnWidth = props.width || 12;
  const columnStyle = getColumnStyle();

  if (isEditing) {
    return (
      <div 
        className="block-container column-block editing"
        style={{ 
          backgroundColor: props.backgroundColor || 'transparent',
          padding: props.padding || 0,
          margin: props.margin || 0,
          border: props.border || '1px dashed #ccc',
          minHeight: '100px',
          ...columnStyle
        }}
      >
        <div className="block-header">
          <span className="block-type">
            <span>📊</span>
            Column ({columnWidth}/12)
          </span>
          <div className="block-actions">
            <Button
              icon={<SettingOutlined />}
              size="small"
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </Button>
            <Popconfirm
              title="Delete this column?"
              onConfirm={() => onDelete?.(block.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </div>
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Width (1-12):</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={columnWidth}
                  onChange={(e) => handlePropsUpdate('width', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label>Background Color:</label>
                <Input
                  type="color"
                  value={props.backgroundColor || '#ffffff'}
                  onChange={(e) => handlePropsUpdate('backgroundColor', e.target.value)}
                />
              </div>
              <div>
                <label>Padding:</label>
                <Input
                  type="number"
                  value={props.padding || 0}
                  onChange={(e) => handlePropsUpdate('padding', parseInt(e.target.value))}
                />
              </div>
            </Space>
          </Card>
        )}

        <div className="add-block-section">
          <AddBlockButton
            availableBlocks={[
              { type: 'text', icon: '📝', label: 'Text' },
              { type: 'image', icon: '🖼️', label: 'Image' },
              { type: 'posts-reel', icon: '📰', label: 'Posts' },
              { type: 'heading', icon: '📋', label: 'Heading' },
              { type: 'button', icon: '🔘', label: 'Button' }
            ]}
            onAddBlock={handleAddBlock}
            buttonText="Add Block"
            buttonType="dashed"
            size="small"
          />
        </div>

        <div className="column-content column-content-container">
          {children.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#999',
              border: '2px dashed #ddd',
              borderRadius: '4px'
            }}>
              <p>Empty column</p>
              {/* <Button 
                icon={<PlusOutlined />} 
                onClick={() => setShowSettings(false)}
              >
                Add Block
              </Button> */}
            </div>
          )}

          {children.map((childBlock) => (
            <BlockRenderer
              key={childBlock.id}
              block={childBlock}
              onBlockUpdate={handleBlockUpdate}
              onBlockDelete={handleBlockDelete}
              isEditing={isEditing}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render mode (not editing)
  return (
    <div 
      className="block-container column-block preview"
      style={{
        backgroundColor: props.backgroundColor || 'transparent',
        padding: props.padding || 0,
        margin: props.margin || 0,
        border: props.border || 'none',
        ...columnStyle
      }}
    >
      {children.map((childBlock) => (
        <BlockRenderer
          key={childBlock.id}
          block={childBlock}
          onBlockUpdate={handleBlockUpdate}
          onBlockDelete={handleBlockDelete}
          isEditing={false}
        />
      ))}
    </div>
  );
};

export { ColumnBlock };
