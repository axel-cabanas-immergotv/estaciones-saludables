// Types for the Website Builder system

export const BlockTypes = {
  TEXT: 'text',
  HEADING: 'heading',
  IMAGE: 'image',
  BUTTON: 'button',
  COLUMN: 'column',
  POSTS_REEL: 'posts-reel',
  RICH_EDITOR: 'richEditor'
};

export const BlockTypeLabels = {
  [BlockTypes.TEXT]: 'Text Block',
  [BlockTypes.HEADING]: 'Heading',
  [BlockTypes.IMAGE]: 'Image',
  [BlockTypes.BUTTON]: 'Button',
  [BlockTypes.COLUMN]: 'Column',
  [BlockTypes.POSTS_REEL]: 'Posts Reel',
  [BlockTypes.RICH_EDITOR]: 'Rich Editor'
};

export const BlockTypeIcons = {
  [BlockTypes.TEXT]: '📝',
  [BlockTypes.HEADING]: '🔤',
  [BlockTypes.IMAGE]: '🖼️',
  [BlockTypes.BUTTON]: '🔘',
  [BlockTypes.COLUMN]: '📊',
  [BlockTypes.POSTS_REEL]: '📰',
  [BlockTypes.RICH_EDITOR]: '✏️'
};

// Base block interface
export const Block = {
  id: String,
  type: String,
  props: Object,
  order: Number,
  children: Array
};

// Specific block prop interfaces
export const TextBlockProps = {
  content: String,
  fontSize: Number,
  fontWeight: String,
  color: String,
  textAlign: String
};

export const HeadingBlockProps = {
  text: String,
  level: Number,
  color: String,
  textAlign: String
};

export const ImageBlockProps = {
  src: String,
  alt: String,
  width: Number,
  height: Number,
  borderRadius: Number,
  objectFit: String
};

export const ButtonBlockProps = {
  text: String,
  url: String,
  variant: String,
  size: String
};

export const ColumnBlockProps = {
  width: Number,
  backgroundColor: String,
  padding: Number,
  margin: Number
};

export const PostsReelBlockProps = {
  category: String,
  limit: Number,
  showExcerpt: Boolean,
  showImage: Boolean,
  layout: String
};

export const RichEditorBlockProps = {
  title: String,
  description: String,
  content: String,
  height: String
};

// Page interface
export const Page = {
  id: String,
  title: String,
  slug: String,
  content: Array, // Array of Block objects
  status: String,
  created_at: String,
  updated_at: String
};

// Available blocks for the builder
export const availableBlocks = [
  {
    type: BlockTypes.TEXT,
    label: BlockTypeLabels[BlockTypes.TEXT],
    icon: BlockTypeIcons[BlockTypes.TEXT],
    description: 'Add text content with rich formatting'
  },
  {
    type: BlockTypes.HEADING,
    label: BlockTypeLabels[BlockTypes.HEADING],
    icon: BlockTypeIcons[BlockTypes.HEADING],
    description: 'Add headings and titles'
  },
  {
    type: BlockTypes.IMAGE,
    label: BlockTypeLabels[BlockTypes.IMAGE],
    icon: BlockTypeIcons[BlockTypes.IMAGE],
    description: 'Insert images with customization options'
  },
  {
    type: BlockTypes.BUTTON,
    label: BlockTypeLabels[BlockTypes.BUTTON],
    icon: BlockTypeIcons[BlockTypes.BUTTON],
    description: 'Add call-to-action buttons'
  },
  {
    type: BlockTypes.COLUMN,
    label: BlockTypeLabels[BlockTypes.COLUMN],
    icon: BlockTypeIcons[BlockTypes.COLUMN],
    description: 'Create multi-column layouts'
  },
  {
    type: BlockTypes.POSTS_REEL,
    label: BlockTypeLabels[BlockTypes.POSTS_REEL],
    icon: BlockTypeIcons[BlockTypes.POSTS_REEL],
    description: 'Display posts in various layouts'
  },
  {
    type: BlockTypes.RICH_EDITOR,
    label: BlockTypeLabels[BlockTypes.RICH_EDITOR],
    icon: BlockTypeIcons[BlockTypes.RICH_EDITOR],
    description: 'Rich text editor with video insertion capabilities'
  }
];
