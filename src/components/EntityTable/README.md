# EntityTable Component

A flexible and feature-rich table component for displaying entity data with various column types, search, filtering, and editing capabilities.

## Column Types

### Image Column

The `image` column type displays images in a circular format with hover preview functionality.

#### Basic Usage

```jsx
const columns = [
    {
        header: 'Avatar',
        field: 'avatar_url',
        type: 'image'
    }
];
```

#### With Custom Size

```jsx
const columns = [
    {
        header: 'Profile Picture',
        field: 'profile_image',
        type: 'image',
        imageSize: 60  // Custom size in pixels (default: 40)
    }
];
```

#### Features

- **Circular Display**: Images are displayed as circular avatars
- **Hover Preview**: Shows a larger version of the image on hover
- **Array Support**: Can handle arrays of image URLs
- **Stacked Display**: Multiple images are stacked with overlap
- **Count Badge**: Shows "+X" for additional images beyond the first 3
- **Error Handling**: Gracefully handles broken image links

#### Array of Images

When the field contains an array of image URLs, the component will:

1. Display the first 3 images stacked
2. Show a count badge if there are more than 3 images
3. Each image can be hovered to see a larger preview

```jsx
const columns = [
    {
        header: 'Gallery',
        field: 'gallery_images',  // Array of image URLs
        type: 'image',
        imageSize: 50
    }
];
```

#### Example Data Structure

```jsx
// Single image
{
    id: 1,
    name: 'User 1',
    avatar_url: 'https://example.com/avatar1.jpg'
}

// Multiple images
{
    id: 2,
    name: 'User 2',
    gallery_images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg'
    ]
}
```

## Other Column Types

- `text`: Simple text display
- `text-with-subtitle`: Text with subtitle below
- `badge`: Colored badge
- `badge-with-color`: Badge with custom color from field
- `user-name`: Special formatting for user names
- `date`: Date formatting
- `code`: Code formatting
- `system-badge`: System entity indicator
- `custom`: Custom render function

## Configuration

```jsx
const config = {
    enableSearch: true,
    columns: columns,
    filters: filterOptions,
    actionHandlers: {
        edit: (type, id) => handleEdit(type, id),
        delete: (type, id) => handleDelete(type, id)
    },
    editorType: 'modal', // 'page', 'modal', 'story'
    editorConfig: {
        title: 'Edit Entity',
        fields: [...],
        modalWidth: 'lg'
    }
};
```

## Props

- `data`: Array of entities or object with data and pagination
- `config`: Configuration object
- `loading`: Loading state
- `ref`: Forwarded ref for accessing component methods

## Methods (via ref)

- `handleCreateNew()`: Open create new entity form
- `handleEdit(type, id)`: Open edit entity form
