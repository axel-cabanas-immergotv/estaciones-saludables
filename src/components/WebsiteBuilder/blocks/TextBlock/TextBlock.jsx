import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm } from 'antd';
import { DeleteOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const TextBlock = ({ block, onUpdate, onDelete, isEditing = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editContent, setEditContent] = useState(block.props?.content || '');
  
  const props = block.props || {};
  const content = props.content || 'New text block. Click to edit.';

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    onUpdate?.(block.id, { props: updatedProps });
  };

  const handleContentEdit = () => {
    if (isEditingText) {
      // Save changes
      handlePropsUpdate('content', editContent);
      setIsEditingText(false);
    } else {
      // Start editing
      setEditContent(content);
      setIsEditingText(true);
    }
  };

  const handleContentCancel = () => {
    setEditContent(content);
    setIsEditingText(false);
  };

  if (isEditing) {
    return (
      <div className="block-container text-block editing">
        <div className="block-header">
          <span className="block-type">
            <span>📝</span>
            Text Block
          </span>
          <div className="block-actions">
            <Button
              icon={isEditingText ? <EditOutlined /> : <EditOutlined />}
              size="small"
              onClick={handleContentEdit}
            >
              {isEditingText ? 'Save' : 'Edit'}
            </Button>
            {isEditingText && (
              <Button size="small" onClick={handleContentCancel}>
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
              title="Delete this text block?"
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
            <TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              placeholder="Enter your text content..."
              style={{ width: '100%' }}
            />
          ) : (
            <div 
              className="text-content"
              style={{
                fontSize: props.fontSize || 16,
                fontWeight: props.fontWeight || 'normal',
                color: props.color || '#333333',
                textAlign: props.textAlign || 'left',
                width: '100%',
                minHeight: '60px',
                padding: '12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fafafa'
              }}
            >
              {content || 'Click Edit to add content...'}
            </div>
          )}
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Font Size:</label>
                <Input
                  type="number"
                  min={12}
                  max={72}
                  value={props.fontSize || 16}
                  onChange={(e) => handlePropsUpdate('fontSize', parseInt(e.target.value))}
                  placeholder="16"
                />
              </div>
              <div>
                <label>Font Weight:</label>
                <select
                  value={props.fontWeight || 'normal'}
                  onChange={(e) => handlePropsUpdate('fontWeight', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                  <option value="800">800</option>
                  <option value="900">900</option>
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
                  <option value="justify">Justify</option>
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
    <div className="block-container text-block preview">
      <div 
        className="text-content"
        style={{
          fontSize: props.fontSize || 16,
          fontWeight: props.fontWeight || 'normal',
          color: props.color || '#333333',
          textAlign: props.textAlign || 'left',
          padding: '16px',
          margin: 0
        }}
      >
        {content}
      </div>
    </div>
  );
};

export { TextBlock };
