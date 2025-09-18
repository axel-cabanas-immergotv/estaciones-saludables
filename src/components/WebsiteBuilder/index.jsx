import React, { useState, useCallback, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Space, Card, Input, Select, message } from 'antd';
import { EyeOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { SortableBlock } from './blocks';
import AddBlockButton from './AddBlockButton';
import { availableBlocks } from '../../types';
import './websiteBuilder.css';

const { Option } = Select;

const WebsiteBuilder = ({
  page,
  onPageUpdate,
  onSave,
  fieldKey = 'content', // Key del campo donde se guardará el JSON
  generateOutput = true // Si debe generar output JSON o mantener estructura completa
}) => {
  // Initialize page data by parsing existing content from various formats
  const initializePageData = (page, fieldKey) => {
    console.log('Initializing page data:', { page, fieldKey });
    
    if (!page) {
      console.log('No page data, returning default');
      return {
        id: 'temp-page',
        title: 'Untitled Page',
        slug: 'untitled-page',
        content: [],
        status: 'draft'
      };
    }

    let content = [];

    // Handle different content formats
    if (page.content && Array.isArray(page.content)) {
      // Direct content array
      console.log('Found direct content array:', page.content);
      content = page.content;
    } else if (page[fieldKey]) {
      // Content stored in field-specific key
      const fieldContent = page[fieldKey];
      console.log(`Found content in fieldKey "${fieldKey}":`, fieldContent);
      
      if (Array.isArray(fieldContent)) {
        content = fieldContent;
      } else if (typeof fieldContent === 'string') {
        // Try to parse JSON string
        try {
          const parsed = JSON.parse(fieldContent);
          console.log('Parsed JSON string:', parsed);
          content = Array.isArray(parsed) ? parsed : (parsed.blocks || parsed.content || []);
        } catch (e) {
          console.warn(`Error parsing ${fieldKey} JSON:`, e);
          content = [];
        }
      } else if (fieldContent && typeof fieldContent === 'object') {
        // Object with blocks/content
        content = fieldContent.blocks || fieldContent.content || [];
      }
    } else if (typeof page === 'string') {
      // Page is a JSON string
      try {
        const parsed = JSON.parse(page);
        console.log('Parsed page JSON string:', parsed);
        content = Array.isArray(parsed) ? parsed : (parsed.blocks || parsed.content || []);
      } catch (e) {
        console.warn('Error parsing page JSON string:', e);
        content = [];
      }
    } else if (typeof page === 'object') {
      // Page is an object, try to find content in common locations
      content = page.blocks || page.content || page.data || [];
      console.log('Found content in object:', content);
    }

    // Ensure content is an array and has proper structure
    if (!Array.isArray(content)) {
      console.log('Content is not an array, using empty array');
      content = [];
    }

    console.log('Final content before normalization:', content);

    // Normalize block structure and ensure IDs
    const normalizedContent = content.map((block, index) => {
      const defaultProps = getDefaultBlockProps(block.type || 'text');
      
      // For richEditor blocks, preserve existing content
      if (block.type === 'richEditor') {
        return {
          id: block.id || `block-${Date.now()}-${index}`,
          type: block.type,
          props: {
            ...defaultProps,
            ...block.props,
            // Preserve existing content if available
            content: block.content || block.props?.content || defaultProps.content
          },
          order: block.order !== undefined ? block.order : index,
          children: Array.isArray(block.children) ? block.children : []
        };
      }
      
      // For other blocks, merge normally
      return {
        id: block.id || `block-${Date.now()}-${index}`,
        type: block.type || 'text',
        props: {
          ...defaultProps,
          ...block.props
        },
        order: block.order !== undefined ? block.order : index,
        children: Array.isArray(block.children) ? block.children : []
      };
    });

    const result = {
      id: page.id || 'temp-page',
      title: page.title || 'Untitled Page',
      slug: page.slug || 'untitled-page',
      content: normalizedContent,
      status: page.status || 'draft'
    };

    console.log('Final initialized data:', result);
    return result;
  };

  // State and effects
  const [isEditing, setIsEditing] = useState(true);
  const [pageData, setPageData] = useState(() => initializePageData(page, fieldKey));

  // Re-initialize when page prop changes (e.g., when editing existing content)
  useEffect(() => {
    console.log(`WebsiteBuilder initializing with fieldKey: ${fieldKey}`, page);
    const initializedData = initializePageData(page, fieldKey);
    console.log('Initialized data:', initializedData);
    setPageData(initializedData);
  }, [page, fieldKey]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = pageData.content.findIndex(block => block.id === active.id);
      const newIndex = pageData.content.findIndex(block => block.id === over.id);
      
      const newContent = arrayMove(pageData.content, oldIndex, newIndex);
      
      // Update order property
      const updatedBlocks = newContent.map((block, index) => ({
        ...block,
        order: index
      }));

      const updatedPage = { ...pageData, content: updatedBlocks };
      setPageData(updatedPage);
      
      // Generate output based on fieldKey and generateOutput flag
      if (generateOutput) {
        const outputData = generateFieldOutput(updatedPage, fieldKey);
        onPageUpdate(outputData);
      } else {
        onPageUpdate(updatedPage);
      }
    }
  }, [pageData, onPageUpdate, fieldKey, generateOutput]);

  const getDefaultBlockProps = (blockType) => {
    switch (blockType) {
      case 'column':
        return {
          width: 12,
          backgroundColor: '#ffffff',
          padding: 20,
          margin: 0
        };
      case 'posts-reel':
        return {
          category: 'featured',
          limit: 3,
          showExcerpt: true,
          showImage: true,
          layout: 'vertical'
        };
      case 'text':
        return {
          content: 'New text block. Click to edit.',
          fontSize: 16,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left'
        };
      case 'image':
        return {
          src: 'https://picsum.photos/400/300',
          alt: 'Sample image',
          width: 400,
          height: 300,
          borderRadius: 0,
          objectFit: 'cover'
        };
      case 'button':
        return {
          text: 'Click me',
          url: '#',
          variant: 'primary',
          size: 'medium'
        };
      case 'heading':
        return {
          text: 'New Heading',
          level: 2,
          color: '#333333',
          textAlign: 'left'
        };
      case 'richEditor':
        return {
          title: '',
          description: '',
          content: '',
          height: '400px'
        };
      default:
        return {};
    }
  };

  const handleBlockUpdate = useCallback((blockId, updates) => {
    console.log('WebsiteBuilder handleBlockUpdate called:', { blockId, updates });
    
    const updatedBlocks = pageData.content.map(block => {
      if (block.id === blockId) {
        // For richEditor blocks, ensure content is properly stored
        if (updates.type === 'richEditor' && updates.content !== undefined) {
          const updatedBlock = {
            ...block,
            ...updates,
            props: {
              ...block.props,
              ...updates,
              content: updates.content
            }
          };
          console.log('Updated richEditor block:', updatedBlock);
          return updatedBlock;
        }
        // For other blocks, merge normally
        return { ...block, ...updates };
      }
      return block;
    });
    
    const updatedPage = { ...pageData, content: updatedBlocks };
    setPageData(updatedPage);
    
    console.log('WebsiteBuilder updated page data:', updatedPage);
    
    // Generate output based on fieldKey and generateOutput flag
    if (generateOutput) {
      const outputData = generateFieldOutput(updatedPage, fieldKey);
      console.log('WebsiteBuilder generated output:', outputData);
      onPageUpdate(outputData);
    } else {
      onPageUpdate(updatedPage);
    }
  }, [pageData, onPageUpdate, fieldKey, generateOutput]);

  const handleBlockDelete = useCallback((blockId) => {
    const updatedBlocks = pageData.content.filter(block => block.id !== blockId);
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index
    }));
    const updatedPage = { ...pageData, content: reorderedBlocks };
    setPageData(updatedPage);
    
    // Generate output based on fieldKey and generateOutput flag
    if (generateOutput) {
      const outputData = generateFieldOutput(updatedPage, fieldKey);
      onPageUpdate(outputData);
    } else {
      onPageUpdate(updatedPage);
    }
    
    message.success('Block deleted successfully');
  }, [pageData, onPageUpdate, fieldKey, generateOutput]);

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: blockType,
      props: getDefaultBlockProps(blockType),
      order: pageData.content.length,
      children: []
    };

    const updatedBlocks = [...pageData.content, newBlock];
    const updatedPage = { ...pageData, content: updatedBlocks };
    setPageData(updatedPage);
    
    // Generate output based on fieldKey and generateOutput flag
    if (generateOutput) {
      const outputData = generateFieldOutput(updatedPage, fieldKey);
      onPageUpdate(outputData);
    } else {
      onPageUpdate(updatedPage);
    }
    
    message.success(`${blockType} block added successfully`);
  };

  // Generate output JSON for the specific field
  const generateFieldOutput = (pageData, fieldKey) => {
    // Ensure we have valid content
    const content = Array.isArray(pageData.content) ? pageData.content : [];
    
    switch (fieldKey) {
      case 'content':
        // Return just the blocks array for content field
        return content;
      case 'blocks':
        // Alternative key for blocks
        return content;
      case 'layout':
        // Return layout structure
        return {
          blocks: content,
          layout: 'vertical',
          version: '1.0'
        };
      case 'page_content':
        // Return full page content structure
        return {
          blocks: content,
          metadata: {
            title: pageData.title,
            lastModified: new Date().toISOString()
          }
        };
      default:
        // Return full page data for custom field keys
        return {
          [fieldKey]: content,
          pageData: pageData
        };
    }
  };

  const handleSave = () => {
    // Generate final output based on fieldKey
    const finalOutput = generateFieldOutput(pageData, fieldKey);
    console.log(`WebsiteBuilder saving ${fieldKey}:`, finalOutput);
    onSave(finalOutput);
    message.success('Content saved successfully');
  };

  return (
    <div className="website-builder" style={{ padding: '20px' }}>
      <div className="builder-header" style={{ 
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <Space>
          <AddBlockButton
            availableBlocks={availableBlocks}
            onAddBlock={handleAddBlock}
            buttonText="Add Block"
            buttonType="default"
          />
        </Space>
      </div>

      <div className="builder-content">
        {/* Main Canvas */}
        <div className="canvas" style={{ width: '100%' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pageData.content.map(block => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                style={{
                  minHeight: '600px',
                  backgroundColor: '#fff',
                  border: '2px dashed #d9d9d9',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'background-color 0.2s'
                }}
              >
                {pageData.content.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <h3>No blocks yet</h3>
                    <p>Use the "Add Block" dropdown above to start building your page</p>
                  </div>
                ) : (
                  // Render blocks in a simple vertical list for better drag & drop
                  pageData.content.map((block, index) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onBlockUpdate={handleBlockUpdate}
                      onBlockDelete={handleBlockDelete}
                      isEditing={isEditing}
                      index={index}
                      allBlocks={pageData.content}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;

// Export SortableBlock for advanced usage
export { default as SortableBlock } from './blocks';
