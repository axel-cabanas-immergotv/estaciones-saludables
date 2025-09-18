import React from 'react';
import { 
  TextBlock, 
  HeadingBlock, 
  ImageBlock, 
  ButtonBlock, 
  ColumnBlock, 
  PostsReelBlock,
  RichEditorBlock
} from './blocks';

const BlockRenderer = ({ block, onBlockUpdate, onBlockDelete, isEditing, parentBlocks = [] }) => {
  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
          />
        );
      case 'heading':
        return (
          <HeadingBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
          />
        );
      case 'image':
        return (
          <ImageBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
          />
        );
      case 'button':
        return (
          <ButtonBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
          />
        );
      case 'column':
        return (
          <ColumnBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
            parentBlocks={parentBlocks}
            onBlockUpdate={onBlockUpdate}
          />
        );
      case 'posts-reel':
        return (
          <PostsReelBlock
            block={block}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
          />
        );
      case 'richEditor':
        return (
          <RichEditorBlock
            id={block.id}
            data={{
              ...block.props,
              content: block.props?.content || block.content || '',
              title: block.props?.title || '',
              description: block.props?.description || '',
              height: block.props?.height || '400px'
            }}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isEditing={isEditing}
            onToggleEdit={(editing) => {
              // Handle edit toggle for RichEditorBlock
              if (onBlockUpdate) {
                onBlockUpdate(block.id, { ...block, isEditing: editing });
              }
            }}
            accountID={block.accountID || ''}
            affiliate_id={block.affiliate_id || ''}
          />
        );
      default:
        return (
          <div className="block-container">
            <div className="block-header">
              <span className="block-type">
                <span>❓</span>
                Unknown Block Type: {block.type}
              </span>
            </div>
            <div className="block-content">
              <p>Unknown block type: {block.type}</p>
            </div>
          </div>
        );
    }
  };

  return renderBlock();
};

export { BlockRenderer };
