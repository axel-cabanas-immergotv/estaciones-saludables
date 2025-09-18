import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm } from 'antd';
import { DeleteOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';

const ImageBlock = ({ block, onUpdate, onDelete, isEditing = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editSrc, setEditSrc] = useState(block.props?.src || '');
  const [editAlt, setEditAlt] = useState(block.props?.alt || '');
  
  const props = block.props || {};
  const src = props.src || 'https://picsum.photos/400/300';
  const alt = props.alt || 'Sample image';

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    onUpdate?.(block.id, { props: updatedProps });
  };

  const handleImageEdit = () => {
    if (isEditingImage) {
      // Save changes
      handlePropsUpdate('src', editSrc);
      handlePropsUpdate('alt', editAlt);
      setIsEditingImage(false);
    } else {
      // Start editing
      setEditSrc(src);
      setEditAlt(alt);
      setIsEditingImage(true);
    }
  };

  const handleImageCancel = () => {
    setEditSrc(src);
    setEditAlt(alt);
    setIsEditingImage(false);
  };

  const renderImage = () => {
    const imageStyle = {
      width: props.width || 400,
      height: props.height || 300,
      borderRadius: props.borderRadius || 0,
      objectFit: props.objectFit || 'cover',
      maxWidth: '100%'
    };

    return (
      <img
        src={src}
        alt={alt}
        style={imageStyle}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
        }}
      />
    );
  };

  if (isEditing) {
    return (
      <div className="block-container image-block editing">
        <div className="block-header">
          <span className="block-type">
            <span>🖼️</span>
            Image Block
          </span>
          <div className="block-actions">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={handleImageEdit}
            >
              {isEditingImage ? 'Save' : 'Edit'}
            </Button>
            {isEditingImage && (
              <Button size="small" onClick={handleImageCancel}>
                Cancel
              </Button>
            )}
            <Button
              icon={<SettingOutlined />}
              size="small"
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </Button>
            <Popconfirm
              title="Delete this image block?"
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

        <div className="block-content">
          {isEditingImage ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Image URL:</label>
                <Input
                  value={editSrc}
                  onChange={(e) => setEditSrc(e.target.value)}
                  placeholder="Enter image URL..."
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Alt Text:</label>
                <Input
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="Enter alt text for accessibility..."
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <img
                  src={editSrc}
                  alt={editAlt}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                  }}
                />
              </div>
            </Space>
          ) : (
            <div className="image-content">
              {renderImage()}
            </div>
          )}
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Width (px):</label>
                <Input
                  type="number"
                  min={100}
                  max={1200}
                  value={props.width || 400}
                  onChange={(e) => handlePropsUpdate('width', parseInt(e.target.value))}
                  placeholder="400"
                />
              </div>
              <div>
                <label>Height (px):</label>
                <Input
                  type="number"
                  min={100}
                  max={800}
                  value={props.height || 300}
                  onChange={(e) => handlePropsUpdate('height', parseInt(e.target.value))}
                  placeholder="300"
                />
              </div>
              <div>
                <label>Border Radius (px):</label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={props.borderRadius || 0}
                  onChange={(e) => handlePropsUpdate('borderRadius', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label>Object Fit:</label>
                <select
                  value={props.objectFit || 'cover'}
                  onChange={(e) => handlePropsUpdate('objectFit', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                  <option value="scale-down">Scale Down</option>
                </select>
              </div>
            </Space>
          </Card>
        )}
      </div>
    );
  }

  // Render mode (not editing)
  return (
    <div className="block-container image-block preview">
      {renderImage()}
    </div>
  );
};

export { ImageBlock };
