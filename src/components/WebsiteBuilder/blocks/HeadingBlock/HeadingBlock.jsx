import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm } from 'antd';
import { DeleteOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';

const HeadingBlock = ({ block, onUpdate, onDelete, isEditing = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editText, setEditText] = useState(block.props?.text || '');
  
  const props = block.props || {};
  const text = props.text || 'New Heading';
  const level = props.level || 2;

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    onUpdate?.(block.id, { props: updatedProps });
  };

  const handleTextEdit = () => {
    if (isEditingText) {
      // Save changes
      handlePropsUpdate('text', editText);
      setIsEditingText(false);
    } else {
      // Start editing
      setEditText(text);
      setIsEditingText(true);
    }
  };

  const handleTextCancel = () => {
    setEditText(text);
    setIsEditingText(false);
  };

  const renderHeading = () => {
    const headingStyle = {
      fontSize: level === 1 ? '2.5rem' : level === 2 ? '2rem' : level === 3 ? '1.5rem' : '1.25rem',
      fontWeight: '600',
      color: props.color || '#333333',
      textAlign: props.textAlign || 'left',
      margin: '0',
      lineHeight: '1.2'
    };

    switch (level) {
      case 1:
        return <h1 style={headingStyle}>{text}</h1>;
      case 2:
        return <h2 style={headingStyle}>{text}</h2>;
      case 3:
        return <h3 style={headingStyle}>{text}</h3>;
      case 4:
        return <h4 style={headingStyle}>{text}</h4>;
      case 5:
        return <h5 style={headingStyle}>{text}</h5>;
      case 6:
        return <h6 style={headingStyle}>{text}</h6>;
      default:
        return <h2 style={headingStyle}>{text}</h2>;
    }
  };

  if (isEditing) {
    return (
      <div className="block-container heading-block editing">
        <div className="block-header">
          <span className="block-type">
            <span>🔤</span>
            Heading (H{level})
          </span>
          <div className="block-actions">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={handleTextEdit}
            >
              {isEditingText ? 'Save' : 'Edit'}
            </Button>
            {isEditingText && (
              <Button size="small" onClick={handleTextCancel}>
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
              title="Delete this heading block?"
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
          {isEditingText ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter heading text..."
              style={{ width: '100%', fontSize: '18px' }}
            />
          ) : (
            <div className="heading-content">
              {renderHeading()}
            </div>
          )}
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Heading Level:</label>
                <select
                  value={level}
                  onChange={(e) => handlePropsUpdate('level', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value={1}>H1 - Main Title</option>
                  <option value={2}>H2 - Section Title</option>
                  <option value={3}>H3 - Subsection Title</option>
                  <option value={4}>H4 - Minor Title</option>
                  <option value={5}>H5 - Small Title</option>
                  <option value={6}>H6 - Smallest Title</option>
                </select>
              </div>
              <div>
                <label>Text Color:</label>
                <Input
                  type="color"
                  value={props.color || '#333333'}
                  onChange={(e) => handlePropsUpdate('color', e.target.value)}
                />
              </div>
              <div>
                <label>Text Align:</label>
                <select
                  value={props.textAlign || 'left'}
                  onChange={(e) => handlePropsUpdate('textAlign', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
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
    <div className="block-container heading-block preview">
      {renderHeading()}
    </div>
  );
};

export { HeadingBlock };
