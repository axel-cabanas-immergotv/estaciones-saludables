import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Space, Input, Form, message } from 'antd';
import { EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import RichEditor from '../../../RichEditor';
import './RichEditorBlock.css';

const { TextArea } = Input;

const RichEditorBlock = ({
  id,
  data = {},
  onUpdate,
  onDelete,
  isEditing = false,
  onToggleEdit,
  accountID = '',
  affiliate_id = ''
}) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState(data.content || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync content with data prop when it changes
  useEffect(() => {
    if (data.content !== undefined && data.content !== content) {
      setContent(data.content);
    }
  }, [data.content]);

  // Handle content change from RichEditor
  const handleContentChange = useCallback((newContent) => {
    console.log('RichEditorBlock handleContentChange called:', { newContent, id });
    setContent(newContent);
    // Immediately update the block data to ensure content is saved
    if (onUpdate) {
      const blockData = {
        ...data,
        content: newContent,
        type: 'richEditor',
        updatedAt: new Date().toISOString()
      };
      console.log('RichEditorBlock calling onUpdate with:', blockData);
      onUpdate(id, blockData);
    }
  }, [id, data, onUpdate]);

  // Handle form submission
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const formData = await form.validateFields();
      const blockData = {
        ...data,
        ...formData,
        content: content,
        type: 'richEditor',
        updatedAt: new Date().toISOString()
      };

      onUpdate(id, blockData);
      message.success('Rich Editor block updated successfully!');
      onToggleEdit(false);
    } catch (error) {
      console.error('Error saving RichEditor block:', error);
      message.error('Error saving block. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [form, content, data, id, onUpdate, onToggleEdit]);

  // Handle delete
  const handleDelete = useCallback(() => {
    onDelete(id);
  }, [id, onDelete]);

  // Initialize form with current data
  React.useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title || '',
        description: data.description || '',
        height: data.height || '400px'
      });
    }
  }, [data, form]);

  if (isEditing) {
    return (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: data.title || '',
            description: data.description || '',
            height: data.height || '400px'
          }}
        >
          <Form.Item
            required
          >
            <RichEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your rich content..."
              height={form.getFieldValue('height') || '400px'}
              accountID={accountID}
              affiliate_id={affiliate_id}
            />
          </Form.Item>
        </Form>
    );
  }

  return (
      <div className="rich-content-display">
        <RichEditor
          value={content}
          onChange={() => {}} // Read-only in display mode
          readOnly={true}
          height={data.height || '400px'}
          accountID={accountID}
          affiliate_id={affiliate_id}
        />
      </div>
  );
};

export default RichEditorBlock;
