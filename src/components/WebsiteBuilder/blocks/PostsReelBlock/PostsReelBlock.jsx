import React, { useState } from 'react';
import { Button, Input, Space, Card, Popconfirm, Select } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';

const { Option } = Select;

const PostsReelBlock = ({ block, onUpdate, onDelete, isEditing = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const props = block.props || {};

  const handlePropsUpdate = (key, value) => {
    const updatedProps = { ...props, [key]: value };
    onUpdate?.(block.id, { props: updatedProps });
  };

  // Mock posts data for demonstration
  const mockPosts = [
    {
      id: 1,
      title: 'Sample Post 1',
      excerpt: 'This is a sample post excerpt that demonstrates how the posts reel will look.',
      image: 'https://picsum.photos/300/200?random=1',
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Sample Post 2',
      excerpt: 'Another sample post with different content to show variety in the layout.',
      image: 'https://picsum.photos/300/200?random=2',
      date: '2024-01-14'
    },
    {
      id: 3,
      title: 'Sample Post 3',
      excerpt: 'A third sample post to complete the posts reel demonstration.',
      image: 'https://picsum.photos/300/200?random=3',
      date: '2024-01-13'
    }
  ];

  const renderPosts = () => {
    const posts = mockPosts.slice(0, props.limit || 3);
    const layout = props.layout || 'vertical';

    if (layout === 'horizontal') {
      return (
        <div className="posts-grid" style={{ 
          gridTemplateColumns: `repeat(${Math.min(posts.length, 3)}, 1fr)` 
        }}>
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              {props.showImage && (
                <img 
                  src={post.image} 
                  alt={post.title}
                  style={{ 
                    width: '100%', 
                    height: '150px', 
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}
                />
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{post.title}</h4>
              {props.showExcerpt && (
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.4'
                }}>
                  {post.excerpt}
                </p>
              )}
              <small style={{ color: '#999' }}>{post.date}</small>
            </div>
          ))}
        </div>
      );
    }

    // Vertical layout
    return (
      <div className="posts-vertical">
        {posts.map((post) => (
          <div key={post.id} className="post-card" style={{ 
            marginBottom: '16px',
            padding: '16px',
            border: '1px solid #e8e8e8',
            borderRadius: '6px',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {props.showImage && (
                <img 
                  src={post.image} 
                  alt={post.title}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{post.title}</h4>
                {props.showExcerpt && (
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {post.excerpt}
                  </p>
                )}
                <small style={{ color: '#999' }}>{post.date}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="block-container posts-reel-block editing">
        <div className="block-header">
          <span className="block-type">
            <span>📰</span>
            Posts Reel
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
              title="Delete this posts reel block?"
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
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Posts Preview</h4>
            {renderPosts()}
          </div>
        </div>

        {showSettings && (
          <Card size="small" className="settings-panel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Category:</label>
                <Input
                  value={props.category || 'featured'}
                  onChange={(e) => handlePropsUpdate('category', e.target.value)}
                  placeholder="featured"
                />
              </div>
              <div>
                <label>Number of Posts:</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={props.limit || 3}
                  onChange={(e) => handlePropsUpdate('limit', parseInt(e.target.value))}
                  placeholder="3"
                />
              </div>
              <div>
                <label>Layout:</label>
                <select
                  value={props.layout || 'vertical'}
                  onChange={(e) => handlePropsUpdate('layout', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal Grid</option>
                </select>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={props.showExcerpt || false}
                    onChange={(e) => handlePropsUpdate('showExcerpt', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Excerpt
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={props.showImage || false}
                    onChange={(e) => handlePropsUpdate('showImage', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Image
                </label>
              </div>
            </Space>
          </Card>
        )}
      </div>
    );
  }

  // Render mode (not editing)
  return (
    <div className="block-container posts-reel-block preview">
      {renderPosts()}
    </div>
  );
};

export { PostsReelBlock };
