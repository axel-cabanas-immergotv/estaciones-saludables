/**
 * MenuItemsEditor Component
 * Specialized component for editing hierarchical menu items with drag & drop support
 * Uses @dnd-kit for robust, accessible drag & drop functionality
 * Supports up to 3 levels of nesting (main -> sub -> sub-sub)
 */
import { useState, useEffect, useRef } from 'react';
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
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import menusService from '../../services/menusService';
import './menuItemsEditor.css';

// ============================================================================
// SORTABLE MENU ITEM COMPONENT
// ============================================================================

const SortableMenuItem = ({ 
    item, 
    index, 
    level = 0, 
    parentPath = [], 
    onEdit, 
    onAdd, 
    onRemove 
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        data: {
            type: 'menu-item',
            item,
            index,
            level,
            parentPath
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const currentPath = [...parentPath, index];
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`menu-item level-${level} ${isDragging ? 'dragging' : ''}`}
            data-id={item.id}
        >
            <div className="menu-item-content">
                <div 
                    className="menu-item-handle"
                    {...attributes}
                    {...listeners}
                >
                    <i className="fas fa-grip-vertical"></i>
                </div>
                
                <div className="menu-item-info flex-grow-1">
                    <div className="menu-item-title">
                        {item.title || 'Untitled'}
                    </div>
                    <div className="menu-item-url text-muted small">
                        {item.url || 'No URL'}
                    </div>
                </div>
                
                <div className="menu-item-actions">
                    <button 
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => onEdit(item, currentPath)}
                        title="Edit Item"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    
                    {level < 2 && (
                        <button 
                            type="button"
                            className="btn btn-sm btn-outline-success me-1"
                            onClick={() => onAdd(currentPath)}
                            title="Add Sub Item"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                    
                    <button 
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemove(currentPath)}
                        title="Remove Item"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            {hasChildren && (
                <SortableSubContainer 
                    items={item.children}
                    level={level + 1}
                    parentPath={currentPath}
                    onEdit={onEdit}
                    onAdd={onAdd}
                    onRemove={onRemove}
                />
            )}
        </div>
    );
};

// ============================================================================
// SORTABLE SUB CONTAINER COMPONENT
// ============================================================================

const SortableSubContainer = ({ 
    items, 
    level, 
    parentPath, 
    onEdit, 
    onAdd, 
    onRemove 
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `sub-container-${parentPath.join('-')}`,
        data: {
            type: 'sub-container',
            level,
            parentPath
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="sub-items-container"
            data-parent-path={parentPath.join('-')}
        >
            <SortableContext 
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {items.map((item, index) => (
                    <SortableMenuItem
                        key={item.id}
                        item={item}
                        index={index}
                        level={level}
                        parentPath={parentPath}
                        onEdit={onEdit}
                        onAdd={onAdd}
                        onRemove={onRemove}
                    />
                ))}
            </SortableContext>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MenuItemsEditor = ({ 
    value = [], 
    onChange, 
    onError 
}) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const [menuItems, setMenuItems] = useState(value || []);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingMode, setEditingMode] = useState('new'); // 'new', 'edit'
    const [editingPath, setEditingPath] = useState([]); // [parentIndex, subIndex] for nested items
    
    // Refs for DOM manipulation
    const itemFormRef = useRef(null);

    // ============================================================================
    // DND KIT SENSORS
    // ============================================================================

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ============================================================================
    // EFFECTS & INITIALIZATION
    // ============================================================================

    useEffect(() => {
        setMenuItems(value || []);
    }, [value]);

    // ============================================================================
    // DRAG & DROP HANDLERS
    // ============================================================================

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!active || !over) {
            return;
        }

        // Get the dragged item data
        const draggedItemData = active.data.current;
        if (!draggedItemData || draggedItemData.type !== 'menu-item') {
            return;
        }

        const { item: draggedItem, index: oldIndex, level: draggedLevel, parentPath: draggedParentPath } = draggedItemData;

        // Get the target container data
        const targetContainerData = over.data.current;
        if (!targetContainerData) {
            return;
        }

        try {
            let newMenuItems = [...menuItems];

            if (targetContainerData.type === 'menu-item') {
                // Dropping on another menu item
                const targetItemData = targetContainerData;
                const targetIndex = targetItemData.index;
                const targetLevel = targetItemData.level;
                const targetParentPath = targetItemData.parentPath;

                if (draggedLevel === targetLevel && draggedParentPath.length === targetParentPath.length) {
                    // Same level, same container - reorder
                    if (draggedParentPath.length === 0) {
                        // Main level reordering
                        newMenuItems = arrayMove(newMenuItems, oldIndex, targetIndex);
                    } else {
                        // Sub level reordering
                        const parentIndex = draggedParentPath[0];
                        if (newMenuItems[parentIndex] && newMenuItems[parentIndex].children) {
                            newMenuItems[parentIndex].children = arrayMove(
                                newMenuItems[parentIndex].children,
                                oldIndex,
                                targetIndex
                            );
                        }
                    }
                } else if (draggedLevel === targetLevel && draggedParentPath.length !== targetParentPath.length) {
                    // Same level, different container - move between containers
                    if (draggedLevel === 0) {
                        // Moving main items between containers (shouldn't happen in normal cases)
                        console.warn('Attempting to move main items between containers - not supported');
                    } else {
                        // Moving sub items between containers
                        const sourceParentIndex = draggedParentPath[0];
                        const targetParentIndex = targetParentPath[0];
                        
                        if (sourceParentIndex !== targetParentIndex) {
                            // Remove from source
                            const movedItem = newMenuItems[sourceParentIndex].children.splice(oldIndex, 1)[0];
                            
                            // Add to target
                            if (!newMenuItems[targetParentIndex].children) {
                                newMenuItems[targetParentIndex].children = [];
                            }
                            newMenuItems[targetParentIndex].children.splice(targetIndex, 0, movedItem);
                        }
                    }
                } else if (draggedLevel !== targetLevel) {
                    // Different levels - promote/demote
                    if (draggedLevel === 0 && targetLevel === 1) {
                        // Promote main item to sub item
                        const movedItem = newMenuItems.splice(oldIndex, 1)[0];
                        const targetParentIndex = targetParentPath[0];
                        
                        if (!newMenuItems[targetParentIndex].children) {
                            newMenuItems[targetParentIndex].children = [];
                        }
                        newMenuItems[targetParentIndex].children.splice(targetIndex, 0, movedItem);
                    } else if (draggedLevel === 1 && targetLevel === 0) {
                        // Demote sub item to main item
                        const sourceParentIndex = draggedParentPath[0];
                        const movedItem = newMenuItems[sourceParentIndex].children.splice(oldIndex, 1)[0];
                        newMenuItems.splice(targetIndex, 0, movedItem);
                    }
                }
            } else if (targetContainerData.type === 'sub-container') {
                // Dropping on a sub-container
                if (draggedLevel === 0 && targetContainerData.level === 1) {
                    // Moving main item to sub-container
                    const movedItem = newMenuItems.splice(oldIndex, 1)[0];
                    const targetParentIndex = targetContainerData.parentPath[0];
                    
                    if (!newMenuItems[targetParentIndex].children) {
                        newMenuItems[targetParentIndex].children = [];
                    }
                    newMenuItems[targetParentIndex].children.push(movedItem);
                }
            }

            // Update state
            setMenuItems(newMenuItems);
            onChange(newMenuItems);

        } catch (error) {
            console.error('Error handling drag end:', error);
            if (onError) onError('Failed to reorder menu items');
        }
    };

    // ============================================================================
    // MENU ITEM CRUD OPERATIONS
    // ============================================================================

    const addMenuItem = (parentPath = []) => {
        setEditingItem(menusService.getDefaultMenuItemData());
        setEditingMode('new');
        setEditingPath(parentPath);
        setShowItemModal(true);
    };

    const editMenuItem = (item, path) => {
        setEditingItem({ ...item });
        setEditingMode('edit');
        setEditingPath(path);
        setShowItemModal(true);
    };

    const removeMenuItem = (path) => {
        if (!window.confirm('Are you sure you want to remove this menu item?')) {
            return;
        }

        try {
            const newMenuItems = [...menuItems];
            
            if (path.length === 1) {
                // Remove main item
                newMenuItems.splice(path[0], 1);
            } else if (path.length === 2) {
                // Remove sub item
                const [parentIndex, itemIndex] = path;
                if (newMenuItems[parentIndex] && newMenuItems[parentIndex].children) {
                    newMenuItems[parentIndex].children.splice(itemIndex, 1);
                }
            }
            
            setMenuItems(newMenuItems);
            onChange(newMenuItems);
        } catch (error) {
            console.error('Error removing menu item:', error);
            if (onError) onError('Failed to remove menu item');
        }
    };

    const saveMenuItem = () => {
        if (!editingItem || !editingItem.title || !editingItem.url) {
            if (onError) onError('Title and URL are required');
            return;
        }

        try {
            const newMenuItems = [...menuItems];
            
            if (editingMode === 'new') {
                // Add new item
                const newItem = {
                    ...editingItem,
                    id: menusService.generateTempId(),
                    children: []
                };
                
                if (editingPath.length === 0) {
                    // Add to main level
                    newMenuItems.push(newItem);
                } else if (editingPath.length === 1) {
                    // Add as sub item
                    const parentIndex = editingPath[0];
                    if (!newMenuItems[parentIndex].children) {
                        newMenuItems[parentIndex].children = [];
                    }
                    newMenuItems[parentIndex].children.push(newItem);
                }
            } else {
                // Edit existing item
                if (editingPath.length === 1) {
                    // Edit main item
                    newMenuItems[editingPath[0]] = { ...newMenuItems[editingPath[0]], ...editingItem };
                } else if (editingPath.length === 2) {
                    // Edit sub item
                    const [parentIndex, itemIndex] = editingPath;
                    newMenuItems[parentIndex].children[itemIndex] = { 
                        ...newMenuItems[parentIndex].children[itemIndex], 
                        ...editingItem 
                    };
                }
            }
            
            setMenuItems(newMenuItems);
            onChange(newMenuItems);
            setShowItemModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Error saving menu item:', error);
            if (onError) onError('Failed to save menu item');
        }
    };

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const renderItemModal = () => {
        if (!showItemModal) return null;
        
        return (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {editingMode === 'edit' ? 'Edit Menu Item' : 'Add Menu Item'}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setShowItemModal(false)}
                            ></button>
                        </div>
                        
                        <div className="modal-body">
                            <form ref={itemFormRef} onSubmit={(e) => { e.preventDefault(); saveMenuItem(); }}>
                                <div className="mb-3">
                                    <label className="form-label">Title *</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={editingItem?.title || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Menu item title"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">URL *</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={editingItem?.url || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://example.com or /page-slug"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Link Target</label>
                                    <select 
                                        className="form-select"
                                        value={editingItem?.target || '_self'}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, target: e.target.value }))}
                                    >
                                        <option value="_self">Same Window</option>
                                        <option value="_blank">New Window</option>
                                    </select>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Icon Class</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={editingItem?.icon || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, icon: e.target.value }))}
                                        placeholder="e.g., fas fa-home"
                                    />
                                    <div className="form-text">FontAwesome icon class (optional)</div>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-control"
                                        rows="2"
                                        value={editingItem?.description || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Optional description"
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setShowItemModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={saveMenuItem}
                            >
                                {editingMode === 'edit' ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <div className="menu-items-editor">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Menu Items</h6>
                <button 
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => addMenuItem()}
                >
                    <i className="fas fa-plus me-1"></i>Add Item
                </button>
            </div>
            
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={menuItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="main-items-container">
                        {menuItems.length === 0 && (
                            <div className="text-center py-4">
                                <div className="text-muted mb-2">No menu items yet</div>
                                <button 
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => addMenuItem()}
                                >
                                    <i className="fas fa-plus me-1"></i>Add First Item
                                </button>
                            </div>
                        )}
                        {menuItems.map((item, index) => (
                            <SortableMenuItem
                                key={item.id}
                                item={item}
                                index={index}
                                level={0}
                                parentPath={[]}
                                onEdit={editMenuItem}
                                onAdd={addMenuItem}
                                onRemove={removeMenuItem}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            
            <div className="mt-3">
                <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Drag items to reorder. You can create up to 3 levels: Main → Sub → Sub-sub
                </small>
            </div>
            
            {renderItemModal()}
        </div>
    );
};

export default MenuItemsEditor; 