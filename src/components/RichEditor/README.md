# RichEditor Component

A completely isolated React component that implements Quill rich text editor with a custom video insertion plugin.

## Features

- ✏️ **Rich Text Editing**: Full-featured text editor based on Quill
- 🎬 **Custom Video Plugin**: Insert videos from API with search functionality
- 🎨 **Customizable Styling**: Modern, responsive design with custom CSS
- 🔌 **Plugin Architecture**: Modular plugin system for easy extensibility
- 📱 **Responsive Design**: Works seamlessly on all device sizes
- 🚀 **Performance Optimized**: Efficient rendering and state management

## Installation

The component requires the following dependencies:

```bash
npm install react-quill quill
```

## Usage

### Basic Usage

```jsx
import RichEditor from './components/RichEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichEditor
      value={content}
      onChange={setContent}
      placeholder="Start writing..."
      accountID="your-account-id"
      affiliate_id="your-affiliate-id"
    />
  );
}
```

### Advanced Usage

```jsx
import RichEditor from './components/RichEditor';

function MyComponent() {
  const [content, setContent] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleContentChange = (newContent, delta, source, editor) => {
    setContent(newContent);
    console.log('Content changed:', { newContent, delta, source, editor });
  };

  return (
    <RichEditor
      value={content}
      onChange={handleContentChange}
      placeholder="Start writing your content..."
      readOnly={isReadOnly}
      height="600px"
      accountID="demo123"
      affiliate_id="aff456"
      className="custom-editor"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | The HTML content of the editor |
| `onChange` | `function` | - | Callback when content changes |
| `placeholder` | `string` | `'Start writing...'` | Placeholder text when editor is empty |
| `readOnly` | `boolean` | `false` | Whether the editor is read-only |
| `accountID` | `string` | `''` | Account ID for video API calls |
| `affiliate_id` | `string` | `''` | Affiliate ID for video API calls |
| `height` | `string` | `'400px'` | Height of the editor |
| `className` | `string` | `''` | Additional CSS classes |

## Video Plugin

The component includes a custom video insertion plugin that:

### API Integration
- Fetches videos from: `/api/video/?accountID={accountID}&search={searchTerm}&affiliate_id={affiliate_id}`
- Returns array of video objects with structure:
  ```json
  {
    "url": "videoURL",
    "poster": "imageURL", 
    "title": "CLIP TITLE"
  }
  ```

### Video Player
- Inserts videos as iframe players
- Player URL: `snippet.univtec.com/player-mobile.html?stream={videoURL}`
- Custom styling with responsive design
- Video title display below player

### Features
- Search functionality for finding videos
- Dropdown selection of up to 10 video results
- Preview thumbnails and titles
- Responsive modal interface
- Error handling for API failures

## Customization

### Styling
The component includes comprehensive CSS that can be customized:

```css
/* Custom video block styles */
.ql-video-block {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #f8f9fa;
}

/* Custom toolbar button */
.ql-toolbar .ql-video-custom {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
}
```

### Plugin Extension
The video plugin can be extended or modified:

```jsx
import VideoBlock from './plugins/VideoBlock';

// Custom plugin instance
const customVideoPlugin = new VideoBlock(quillInstance, {
  apiEndpoint: '/custom/api/videos/',
  accountID: 'custom-id',
  affiliate_id: 'custom-affiliate'
});
```

## File Structure

```
src/components/RichEditor/
├── RichEditor.jsx          # Main component
├── RichEditor.css          # Component styles
├── index.js               # Exports
├── README.md              # This documentation
├── RichEditorDemo.jsx     # Demo component
└── plugins/
    └── VideoBlock.js      # Custom video plugin
```

## Integration with WebsiteBuilder

The component is fully integrated with the WebsiteBuilder system:

### Block Type
- Type: `richEditor`
- Label: "Rich Editor"
- Icon: ✏️
- Description: "Rich text editor with video insertion capabilities"

### Block Properties
```json
{
  "title": "Block Title",
  "description": "Optional description",
  "content": "HTML content",
  "height": "400px"
}
```

### Usage in WebsiteBuilder
```jsx
import { RichEditorBlock } from './blocks';

// The block will automatically render with full editing capabilities
<RichEditorBlock
  id={block.id}
  data={block.props}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  isEditing={isEditing}
  onToggleEdit={handleToggleEdit}
  accountID={accountID}
  affiliate_id={affiliate_id}
/>
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Uses React hooks efficiently with `useCallback` and `useEffect`
- Lazy loading of video plugin
- Debounced search for video API calls
- Optimized re-rendering with proper dependency arrays

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Ensure Quill is properly imported and initialized
2. **Video API errors**: Check network requests and API endpoint configuration
3. **Styling conflicts**: Ensure CSS isolation with proper class names
4. **Performance issues**: Check for unnecessary re-renders in parent components

### Debug Mode

Enable console logging for debugging:

```jsx
// The component logs important events to console
console.log('Content changed:', newContent);
console.log('Error fetching videos:', error);
```

## Contributing

When extending the component:

1. Maintain isolation - no external dependencies beyond Quill
2. Follow React best practices
3. Use TypeScript-like prop validation
4. Include comprehensive CSS for all states
5. Test with various content types and sizes

## License

This component is part of the Fisca project.
