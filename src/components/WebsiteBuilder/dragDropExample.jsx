import React, { useState } from 'react';
import WebsiteBuilder from './index';

// Simple example demonstrating drag & drop functionality
const DragDropExample = () => {
  const [pageData, setPageData] = useState({
    id: 'example-page',
    title: 'Drag & Drop Example',
    slug: 'drag-drop-example',
    content: [
      {
        id: 'block-1',
        type: 'heading',
        props: {
          text: 'First Block - Drag me!',
          level: 1,
          color: '#2c3e50',
          textAlign: 'center'
        },
        order: 0,
        children: []
      },
      {
        id: 'block-2',
        type: 'text',
        props: {
          content: 'This is the second block. You can drag blocks up and down to reorder them.',
          fontSize: 16,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left'
        },
        order: 1,
        children: []
      },
      {
        id: 'block-3',
        type: 'image',
        props: {
          src: 'https://picsum.photos/400/200?random=1',
          alt: 'Sample image',
          width: 400,
          height: 200,
          borderRadius: 8,
          objectFit: 'cover'
        },
        order: 2,
        children: []
      },
      {
        id: 'block-4',
        type: 'button',
        props: {
          text: 'Click me!',
          url: '#',
          variant: 'primary',
          size: 'medium'
        },
        order: 3,
        children: []
      }
    ],
    status: 'draft'
  });

  const handlePageUpdate = (updatedPage) => {
    console.log('Page updated:', updatedPage);
    setPageData(updatedPage);
  };

  const handleSave = (pageData) => {
    console.log('Page saved:', pageData);
    alert('Page saved! Check the console to see the new block order.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="text-center mb-4">
        <h1>Website Builder - Drag & Drop Demo</h1>
        <p className="lead">
          Try dragging the blocks below to reorder them. The order will be automatically updated!
        </p>
        <div className="alert alert-info">
          <strong>Instructions:</strong>
          <ul className="mb-0 mt-2">
            <li>Hover over any block to see the blue drag handle (⋮⋮) in the top-right corner</li>
            <li>ONLY the blue handle is draggable - the rest of the block is not</li>
            <li>Click and drag the handle to move blocks up or down</li>
            <li>You can still interact with block settings and content normally</li>
            <li>Blocks will automatically reorder and update their position</li>
            <li>Check the console to see the updated data structure</li>
          </ul>
        </div>
      </div>

      <WebsiteBuilder
        page={pageData}
        onPageUpdate={handlePageUpdate}
        onSave={handleSave}
      />

      <div className="mt-4">
        <h3>Current Block Order:</h3>
        <div className="list-group">
          {pageData.content.map((block, index) => (
            <div key={block.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{index + 1}.</strong> {block.type} - {block.props.text || block.props.content || 'Image/Button'}
              </div>
              <span className="badge bg-primary rounded-pill">Order: {block.order}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3>Features Demonstrated:</h3>
        <ul>
          <li><strong>Drag & Drop Selectivo</strong> - Solo el botón azul es arrastrable</li>
          <li><strong>Sin Interferencias</strong> - Los paneles de configuración funcionan normalmente</li>
          <li><strong>Visual Feedback</strong> - Handles de drag claros y visibles</li>
          <li><strong>Real-time Updates</strong> - Los cambios de orden se reflejan inmediatamente</li>
          <li><strong>Data Persistence</strong> - El nuevo orden se mantiene en los datos de la página</li>
          <li><strong>Smooth Animations</strong> - Transiciones y efectos visuales durante el drag</li>
        </ul>
      </div>
    </div>
  );
};

export default DragDropExample;
