import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm } from 'antd';
import { DeleteOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';

const ButtonBlock = ({ block, onUpdate, onDelete, isEditing = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingButton, setIsEditingButton] = useState(false);
  const [editText, setEditText] = useState(block.props?.text || '');
  const [editUrl, setEditUrl] = useState(block.props?.url || '');
  
  const props = block.props || {};
  const text = props.text || 'Click me';
  const url = props.url || '#';
  const variant = props.variant || 'primary';
  const size = props.size || 'medium';

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    onUpdate?.(block.id, { props: updatedProps });
  };

  const handleButtonEdit = () => {
    if (isEditingButton) {
      // Save changes
      handlePropsUpdate('text', editText);
      handlePropsUpdate('url', editUrl);
      setIsEditingButton(false);
    } else {
      // Start editing
      setEditText(text);
      setEditUrl(url);
      setIsEditingButton(true);
    }
  };

  const handleButtonCancel = () => {
    setEditText(text);
    setEditUrl(url);
    setIsEditingButton(false);
  };

  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'success':
        return 'primary';
      case 'danger':
        return 'primary';
      case 'warning':
        return 'primary';
      case 'info':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'middle';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      minWidth: '120px',
      fontWeight: '500'
    };

    switch (variant) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#52c41a', borderColor: '#52c41a' };
      case 'danger':
        return { ...baseStyle, backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#faad14', borderColor: '#faad14' };
      case 'info':
        return { ...baseStyle, backgroundColor: '#1890ff', borderColor: '#1890ff' };
      default:
        return baseStyle;
    }
  };

  const renderButton = () => {
    const buttonStyle = getButtonStyle();
    
    return (
      <Button
        type={getButtonType()}
        size={getButtonSize()}
        style={buttonStyle}
        onClick={() => {
          if (url && url !== '#') {
            window.open(url, '_blank');
          }
        }}
      >
        {text}
      </Button>
    );
  };

  if (isEditing) {
    return (
      <div className="block-container button-block editing">
        <div className="block-header">
          <span className="block-type">
            <span>🔘</span>
            Button Block
          </span>
          <div className="block-actions">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={handleButtonEdit}
            >
              {isEditingButton ? 'Save' : 'Edit'}
            </Button>
            {isEditingButton && (
              <Button size="small" onClick={handleButtonCancel}>
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
              title="Delete this button block?"
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
          {isEditingButton ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Button Text:</label>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter button text..."
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Button URL:</label>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="Enter URL (or # for no action)..."
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                {renderButton()}
              </div>
            </Space>
          ) : (
            <div className="button-content">
              {renderButton()}
            </div>
          )}
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Button Variant:</label>
                <select
                  value={variant}
                  onChange={(e) => handlePropsUpdate('variant', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="success">Success</option>
                  <option value="danger">Danger</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label>Button Size:</label>
                <select
                  value={size}
                  onChange={(e) => handlePropsUpdate('size', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
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
    <div className="block-container button-block preview">
      {renderButton()}
    </div>
  );
};

export { ButtonBlock };
