// Import and export all block components
export { TextBlock } from './TextBlock';
export { ButtonBlock } from './ButtonBlock';
export { ColumnBlock } from './ColumnBlock';
export { HeadingBlock } from './HeadingBlock';
export { ImageBlock } from './ImageBlock';
export { PostsReelBlock } from './PostsReelBlock';
export { default as SortableBlock } from './SortableBlock';
export { default as RichEditorBlock } from './RichEditorBlock';

// Import common styles
import './CommonStyles.css';

// Default export with all blocks
import { TextBlock } from './TextBlock';
import { ButtonBlock } from './ButtonBlock';
import { ColumnBlock } from './ColumnBlock';
import { HeadingBlock } from './HeadingBlock';
import { ImageBlock } from './ImageBlock';
import { PostsReelBlock } from './PostsReelBlock';
import SortableBlock from './SortableBlock';
import RichEditorBlock from './RichEditorBlock';

export default {
  TextBlock,
  ButtonBlock,
  ColumnBlock,
  HeadingBlock,
  ImageBlock,
  PostsReelBlock,
  SortableBlock,
  RichEditorBlock
};
