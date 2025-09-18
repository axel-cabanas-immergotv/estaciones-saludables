import React, { useRef } from 'react';
import EntityTable from './index';

const EntityTableExample = () => {
    const tableRef = useRef();

    // Example data with images
    const exampleData = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://via.placeholder.com/150/007cba/ffffff?text=JD',
            status: 'active'
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: 'https://via.placeholder.com/150/28a745/ffffff?text=JS',
            status: 'inactive'
        },
        {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@example.com',
            gallery: [
                'https://via.placeholder.com/150/ffc107/000000?text=1',
                'https://via.placeholder.com/150/dc3545/ffffff?text=2',
                'https://via.placeholder.com/150/17a2b8/ffffff?text=3',
                'https://via.placeholder.com/150/6f42c1/ffffff?text=4'
            ],
            status: 'active'
        },
        {
            id: 4,
            name: 'Alice Brown',
            email: 'alice@example.com',
            avatar: 'https://via.placeholder.com/150/e83e8c/ffffff?text=AB',
            status: 'pending'
        }
    ];

    // Column configuration
    const columns = [
        {
            header: 'Avatar',
            field: 'avatar',
            type: 'image',
            imageSize: 45
        },
        {
            header: 'Name',
            field: 'name',
            type: 'text'
        },
        {
            header: 'Email',
            field: 'email',
            type: 'text'
        },
        {
            header: 'Gallery',
            field: 'gallery',
            type: 'image',
            imageSize: 40
        },
        {
            header: 'Status',
            field: 'status',
            type: 'badge',
            badgeClass: (value) => {
                switch (value) {
                    case 'active': return 'bg-success';
                    case 'inactive': return 'bg-secondary';
                    case 'pending': return 'bg-warning';
                    default: return 'bg-secondary';
                }
            }
        }
    ];

    // Configuration
    const config = {
        tableId: 'users-table',
        entityType: 'user',
        enableSearch: true,
        columns: columns,
        emptyMessage: 'No users found.',
        showViewButton: false,
        disableEdit: false,
        disableDelete: false,
        disableCreate: false
    };

    // Action handlers
    const actionHandlers = {
        edit: (type, id) => {
            console.log('Edit user:', id);
        },
        delete: (type, id) => {
            console.log('Delete user:', id);
        }
    };

    return (
        <div className="container mt-4">
            <h2>EntityTable with Image Columns Example</h2>
            <p className="text-muted">
                This example demonstrates the new "image" column type with both single images and arrays of images.
            </p>
            
            <EntityTable
                ref={tableRef}
                data={exampleData}
                config={{
                    ...config,
                    actionHandlers
                }}
            />
            
            <div className="mt-4">
                <h4>Features Demonstrated:</h4>
                <ul>
                    <li><strong>Single Image:</strong> Avatar column shows circular images with hover preview</li>
                    <li><strong>Multiple Images:</strong> Gallery column shows stacked circular images</li>
                    <li><strong>Hover Preview:</strong> Hover over any image to see a larger version</li>
                    <li><strong>Stacked Display:</strong> Multiple images overlap with proper z-index</li>
                    <li><strong>Count Badge:</strong> Shows "+1" for additional images beyond the first 3</li>
                </ul>
            </div>
        </div>
    );
};

export default EntityTableExample;
