import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Link } from 'react-router-dom';
import DynamicPage from '../DynamicPage';
import DynamicModal from '../DynamicModal';
import DynamicStory from '../DynamicStory';
import Search from '../Search';
import Pagination from '../Pagination';
import './entityTable.css';

const EntityTable = forwardRef(({ 
    data = [], 
    config = {},
    loading = false,
    onPageChange: propOnPageChange,
    onSearchChange: propOnSearchChange,
    onClick: propOnClick,
    checkPermissions = null, // Función personalizada para verificar permisos (botones estándar)
    checkCustomActionPermissions = null // Función personalizada para verificar permisos de custom actions
}, ref) => {
    // Handle both old format (array) and new format (object with data and pagination)
    const entities = Array.isArray(data) ? data : (data.data || []);
    const pagination = data.pagination || null;

    const [searchTerm, setSearchTerm] = useState(config.currentSearch || '');
    const [filters, setFilters] = useState(config.currentFilters || {});
    const [searchTimeout, setSearchTimeout] = useState(null);
    
    // Sorting state
    const [sortBy, setSortBy] = useState(config.currentSortBy || null);
    const [sortOrder, setSortOrder] = useState(config.currentSortOrder || null); // 'asc', 'desc', null
    
    // Editor state
    const [showEditor, setShowEditor] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [editorLoading, setEditorLoading] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);
    const [showCustomActions, setShowCustomActions] = useState(false);

    // Extract configuration with defaults
    const {
        tableId = 'entity-table',
        entityType = 'entity',
        emptyMessage = 'No items found.',
        enableSearch = false,
        columns = [],
        filters: filterOptions = [],
        actionHandlers = {},
        disableEdit = false,
        disableDelete = false,
        showViewButton = false,
        viewUrl = null,
        customActions = [],
        conditionalEdit = null,
        conditionalDelete = null,
        onSearch: configOnSearch = null,
        onPageChange: configOnPageChange = null,
        onPageSizeChange = null,
        onSort: configOnSort = null,
        onClick: configOnClick = null,
        // Editor configuration
        editorType = 'page', // 'page', 'modal', 'story'
        editorConfig = {},
        onLoadEntity = null,
        onSaveEntity = null,
        // Row styling configuration
        getRowStyle = null
    } = config;

    // Use props with priority over config
    const onSearch = propOnSearchChange || configOnSearch;
    const onPageChange = propOnPageChange || configOnPageChange;
    const onSort = configOnSort;
    const onClick = propOnClick || configOnClick;
    // Debounced search function
    const debouncedSearch = useCallback(() => {
        if (onSearch) {
            onSearch(searchTerm, filters);
        }
    }, [searchTerm, filters, onSearch]);

    // Handle search input changes
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        const timeout = setTimeout(() => {
            debouncedSearch();
        }, 500);
        
        setSearchTimeout(timeout);
    };

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters };
        if (value) {
            newFilters[field] = value;
        } else {
            delete newFilters[field];
        }
        setFilters(newFilters);
        
        if (onSearch) {
            onSearch(searchTerm, newFilters);
        }
    };

    // Handle clear search
    const handleClearSearch = () => {
        setSearchTerm('');
        setFilters({});
        if (onSearch) {
            onSearch('', {});
        }
    };

    // Handle column sorting
    const handleColumnSort = (field) => {
        if (!onSort) return; // If no sort handler provided, do nothing
        
        let newSortOrder;
        
        if (sortBy !== field) {
            // Different column clicked - start with ascending
            newSortOrder = 'asc';
        } else {
            // Same column clicked - cycle through: asc -> desc -> none
            switch (sortOrder) {
                case 'asc':
                    newSortOrder = 'desc';
                    break;
                case 'desc':
                    newSortOrder = null;
                    break;
                default:
                    newSortOrder = 'asc';
            }
        }
        
        // Update local state
        setSortBy(newSortOrder ? field : null);
        setSortOrder(newSortOrder);
        
        // Call parent handler with sorting params
        onSort(newSortOrder ? field : null, newSortOrder);
    };

    // Handle edit action
    const handleEdit = async (type, id) => {
        if (id && onLoadEntity) {
            // Show editor immediately with loading state
            setShowEditor(true);
            setEditingEntity(null); // Clear previous data
            setEditorLoading(true);
            
            // Load entity data in parallel
            try {
                const entityData = await onLoadEntity(id);
                setEditingEntity(entityData);
            } catch (error) {
                console.error('Error loading entity:', error);
                setEditingEntity(null);
            } finally {
                setEditorLoading(false);
            }
        } else {
            setEditingEntity(null); // New entity
            setShowEditor(true);
        }
    };

    // Handle create new action  
    const handleCreateNew = () => {
        setEditingEntity(null);
        setShowEditor(true);
    };

    // Handle save entity
    const handleSaveEntity = async (entityData) => {
        if (onSaveEntity) {
            try {
                await onSaveEntity(entityData, editingEntity?.id || null);
                setShowEditor(false);
                setEditingEntity(null);
            } catch (error) {
                console.error('EntityTable: Error saving entity:', error);
                // Don't close editor if save failed
            }
        } else {
            console.error('EntityTable: No onSaveEntity function provided');
        }
    };

    // Expose functions to parent component via ref
    useImperativeHandle(ref, () => ({
        handleCreateNew,
        handleEdit
    }));

    // Handle cancel edit
    const handleCancelEdit = () => {
        setShowEditor(false);
        setEditingEntity(null);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const checkUserPermissions = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.success && userData.user) {
                    // Verificar permisos para botones estándar
                    let hasStandardPermission = false;
                    if (checkPermissions && typeof checkPermissions === 'function') {
                        hasStandardPermission = checkPermissions(userData.user);
                    } else {
                        // Lógica por defecto: solo admin
                        hasStandardPermission = userData.user.role && userData.user.role.name === 'admin';
                    }
                    setShowActionButtons(hasStandardPermission);

                    // Verificar permisos para custom actions
                    let hasCustomActionPermission = false;
                    if (checkCustomActionPermissions && typeof checkCustomActionPermissions === 'function') {
                        hasCustomActionPermission = checkCustomActionPermissions(userData.user);
                    }
                    setShowCustomActions(hasCustomActionPermission);
                } else {
                    setShowActionButtons(false);
                    setShowCustomActions(false);
                }
            } else {
                setShowActionButtons(false);
                setShowCustomActions(false);
            }
        } catch (error) {
            console.error('Error verificando permisos de usuario:', error);
            setShowActionButtons(false);
            setShowCustomActions(false);
        }
    }, [checkPermissions, checkCustomActionPermissions]);

    useEffect(() => {
        checkUserPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkPermissions, checkCustomActionPermissions])

    // Enhanced action handlers that support editing
    const enhancedActionHandlers = {
        ...actionHandlers,
        edit: (type, id) => {
            if (editorConfig && editorConfig.fields) {
                handleEdit(type, id);
            } else if (actionHandlers.edit) {
                actionHandlers.edit(type, id);
            }
        }
    };

    // Image column component for displaying circular images with hover preview
    const ImageColumn = ({ value, size = 40 }) => {
        if (!value) return <span className="text-muted">-</span>;
        
        // Handle array of images
        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-muted">-</span>;
            
            return (
                <div className="image-stack">
                    {value.slice(0, 3).map((url, index) => (
                        <div
                            key={index}
                            className="stacked-image"
                            style={{
                                width: size,
                                height: size,
                                marginLeft: index > 0 ? `-${size * 0.3}px` : 0,
                                zIndex: value.length - index
                            }}
                            data-tooltip={`Image ${index + 1}`}
                        >
                            <img
                                src={url}
                                alt={`Image ${index + 1}`}
                                className="circular-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            {/* Hover preview */}
                            <div className="image-preview">
                                <img src={url} alt={`Preview ${index + 1}`} />
                            </div>
                        </div>
                    ))}
                    {value.length > 3 && (
                        <div
                            className="image-count-badge"
                            style={{
                                width: size,
                                height: size,
                                marginLeft: `-${size * 0.3}px`,
                                zIndex: 1
                            }}
                        >
                            <span>+{value.length - 3}</span>
                        </div>
                    )}
                </div>
            );
        }
        
        // Handle single image
        return (
            <div className="single-image-container">
                <img
                    src={value}
                    alt="Image"
                    className="circular-image"
                    style={{ width: size, height: size }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Hover preview */}
                <div className="image-preview">
                    <img src={value} alt="Preview" />
                </div>
            </div>
        );
    };

    // Render table cell based on column type
    const renderTableCell = (entity, column) => {
        const value = getNestedProperty(entity, column.field);
        
        switch (column.type) {
            case 'text':
                return <strong>{value || '-'}</strong>;
                
            case 'text-with-subtitle': {
                const subtitle = getNestedProperty(entity, column.subtitleField);
                return (
                    <div>
                        <strong>{value || '-'}</strong>
                        {subtitle && <><br /><small className="text-muted">{subtitle}</small></>}
                    </div>
                );
            }
                
            case 'badge': {
                const badgeClass = column.badgeClass ? column.badgeClass(value) : 'bg-secondary';
                return <span className={`badge ${badgeClass}`}>{value || '-'}</span>;
            }
                
            case 'badge-with-color': {
                const bgColor = getNestedProperty(entity, column.colorField) || '#6c757d';
                return (
                    <span 
                        className="badge rounded-pill" 
                        style={{ backgroundColor: bgColor }}
                    >
                        {value || '-'}
                    </span>
                );
            }
                
            case 'user-name': {
                const firstName = getNestedProperty(entity, 'author.first_name');
                const lastName = getNestedProperty(entity, 'author.last_name');
                return firstName && lastName ? `${firstName} ${lastName}` : '-';
            }
                
            case 'date':
                return value ? new Date(value).toLocaleDateString() : '-';
                
            case 'boolean':
                return (
                    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
                        <i className={`fas ${value ? 'fa-check' : 'fa-times'} me-1`}></i>
                        {value ? 'Sí' : 'No'}
                    </span>
                );
                
            case 'phone': {
                if (!value) return <span className="text-muted">-</span>;
                
                const cleanPhone = value.toString().replace(/[\s\-()]/g, '');
                
                const phoneNumber = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;
                
                const whatsappUrl = `https://wa.me/${phoneNumber}`;
                
                return (
                    <a 
                        href={whatsappUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-success text-decoration-none"
                        title="Contactar por WhatsApp"
                    >
                        <i className="fab fa-whatsapp me-1"></i>
                        {value}
                    </a>
                );
            }
                
            case 'code':
                return <code>/{value}</code>;
                
            case 'system-badge':
                return entity.is_system ? <span className="badge bg-info ms-2">System</span> : '';
                
            case 'image':
                return <ImageColumn value={value} size={column.imageSize || 40} />;
                
            case 'tags': {
                if (!value) return <span className="text-muted">-</span>;
                
                // Split by double pipe and filter empty values
                const tags = value.toString().split('||').filter(tag => tag.trim());
                
                if (tags.length === 0) return <span className="text-muted">-</span>;
                
                return (
                    <div className="d-flex flex-wrap gap-1">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className={`badge ${column.badgeClass || 'bg-secondary'}`}
                                style={column.badgeStyle || {}}
                            >
                                {tag.trim()}
                            </span>
                        ))}
                    </div>
                );
            }
                
            case 'link': {
                if (!value) return <span className="text-muted">-</span>;
                
                // Build the link URL
                let linkUrl = column.linkUrl || '#';
                if (typeof column.linkUrl === 'function') {
                    linkUrl = column.linkUrl(entity, value);
                } else if (column.linkUrl) {
                    // Replace placeholders in URL
                    linkUrl = column.linkUrl.replace(/\{(\w+)\}/g, (match, key) => {
                        return getNestedProperty(entity, key) || match;
                    });
                }
                
                // Build query params if specified
                let queryParams = '';
                if (column.queryParams) {
                    const params = new URLSearchParams();
                    if (typeof column.queryParams === 'function') {
                        const dynamicParams = column.queryParams(entity, value);
                        Object.entries(dynamicParams).forEach(([key, val]) => {
                            if (val !== null && val !== undefined) {
                                params.append(key, val);
                            }
                        });
                    } else {
                        Object.entries(column.queryParams).forEach(([key, val]) => {
                            if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
                                // Extract dynamic value from entity
                                const fieldPath = val.slice(1, -1);
                                const dynamicValue = getNestedProperty(entity, fieldPath);
                                if (dynamicValue !== null && dynamicValue !== undefined) {
                                    params.append(key, dynamicValue);
                                }
                            } else if (val !== null && val !== undefined) {
                                params.append(key, val);
                            }
                        });
                    }
                    
                    if (params.toString()) {
                        queryParams = '?' + params.toString();
                    }
                }
                
                const fullUrl = linkUrl + queryParams;
                
                return (
                    <Link
                        to={fullUrl}
                        className={column.linkClass || 'text-primary text-decoration-none fw-bold'}
                        style={column.linkStyle || {}}
                        title={column.linkTitle || `Ver ${value}`}
                    >
                        {value}
                    </Link>
                );
            }
                
            case 'custom':
                return column.render ? column.render(entity, value) : (value || '-');
                
            default:
                return value !== null && value !== undefined ? value : '-';
        }
    };

    // Render action buttons
    const renderActionButtons = (entity) => {
        const buttons = [];
        
        // Edit button
        if (!disableEdit && (!conditionalEdit || conditionalEdit(entity)) && showActionButtons) {
            buttons.push(
                <button
                    key="edit"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => enhancedActionHandlers.edit && enhancedActionHandlers.edit(entityType, entity.id)}
                >
                    <i className="fas fa-edit"></i>
                </button>
            );
        }
        
        // View/Preview button
        if (showViewButton && viewUrl && showActionButtons) {
            const url = typeof viewUrl === 'function' ? viewUrl(entity) : viewUrl.replace(':id', entity.id);
            buttons.push(
                <a
                    key="view"
                    href={url}
                    target="_blank"
                    className="btn btn-sm btn-outline-secondary"
                    rel="noreferrer"
                >
                    <i className="fas fa-eye"></i>
                </a>
            );
        }
        
        // Delete button
        if (!disableDelete && (!conditionalDelete || conditionalDelete(entity)) && showActionButtons) {
            buttons.push(
                <button
                    key="delete"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => enhancedActionHandlers.delete && enhancedActionHandlers.delete(entityType, entity.id)}
                >
                    <i className="fas fa-trash"></i>
                </button>
            );
        }
        
        // Custom action buttons - usar showCustomActions en lugar de showActionButtons
        if (customActions && showCustomActions) {
            customActions.forEach((action, index) => {
                if (!action.condition || action.condition(entity)) {
                    // If action has custom render function, use it
                    if (action.render && typeof action.render === 'function') {
                        buttons.push(
                            <div key={`custom-${index}`} className="d-inline-block">
                                {action.render(entity)}
                            </div>
                        );
                    } else {
                        // Default button rendering
                        buttons.push(
                            <button
                                key={`custom-${index}`}
                                className={`btn btn-sm ${action.class || 'btn-outline-primary'}`}
                                onClick={() => enhancedActionHandlers[action.action] && enhancedActionHandlers[action.action](entityType, entity.id)}
                            >
                                <i className={action.icon}></i> {action.label || ''}
                            </button>
                        );
                    }
                }
            });
        }
        
        return (
            <div className="btn-group gap-2">
                {buttons}
            </div>
        );
    };

    // Get nested property value
    const getNestedProperty = (obj, path) => {
        if (!path || typeof path !== 'string') return null;
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    };

    // Render sort indicator for column headers
    const renderSortIndicator = (column) => {
        if (!column.sortable) return null;
        
        const field = column.sortField || column.field;
        
        if (sortBy === field) {
            return (
                <i className={`fas ms-1 ${
                    sortOrder === 'asc' ? 'fa-sort-up text-primary' :
                    sortOrder === 'desc' ? 'fa-sort-down text-primary' : 
                    'fa-sort text-muted'
                }`}></i>
            );
        }
        
        return <i className="fas fa-sort text-muted ms-1"></i>;
    };

    // Render search and filters using the generic Search component
    const renderSearchAndFilters = () => {
        return (
            <Search
                enableSearch={enableSearch}
                searchTerm={searchTerm}
                searchPlaceholder="Buscar..."
                onSearchChange={handleSearchChange}
                onSearchExecute={(term, filters) => {
                    // Ejecutar búsqueda cuando se hace clic en buscar o Enter
                    if (onSearch) {
                        onSearch(term, filters);
                    }
                }}
                onClearSearch={handleClearSearch}
                filterOptions={filterOptions}
                filters={filters}
                onFilterChange={handleFilterChange}
                autoSearch={true} // Mantener comportamiento legacy para EntityTable
                showCard={true}
                cardClassName="card mb-4"
            />
        );
    };

    // Render pagination using generic Pagination component
    const renderPagination = () => {
        return (
            <Pagination
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        );
    };

    // Render editor component based on type
    const renderEditor = () => {
        if (!showEditor || !editorConfig) return null;

        switch (editorType) {
            case 'page':
                return (
                    <DynamicPage
                        show={showEditor}
                        title={editorConfig.title || `${editingEntity ? 'Edit' : 'Create'} ${entityType}`}
                        config={editorConfig}
                        entityData={editingEntity}
                        onSave={handleSaveEntity}
                        onCancel={handleCancelEdit}
                        loading={editorLoading}
                    />
                );
            case 'modal':
                return (
                    <DynamicModal
                        isOpen={showEditor}
                        onClose={handleCancelEdit}
                        onSave={handleSaveEntity}
                        data={editingEntity}
                        config={editorConfig}
                        loading={editorLoading}
                        modalWidth={editorConfig.modalWidth}
                    />
                );
            case 'story':
                return (
                    <DynamicStory
                        show={showEditor}
                        title={editorConfig.title || `${entityType} Editor`}
                        config={editorConfig}
                        entityData={editingEntity}
                        onSave={handleSaveEntity}
                        onCancel={handleCancelEdit}
                        loading={loading}
                    />
                );
            default:
                return null;
        }
    };

    // Empty state
    if (!entities.length && !loading) {
        return (
            <>
                <div className="entity-table-container">
                    {renderSearchAndFilters()}
                    
                    <div className="alert alert-info text-center py-4">
                        <i className="fas fa-search fa-2x text-muted mb-3"></i>
                        <div className="h5">{emptyMessage}</div>
                        <p className="text-muted mb-0">
                            {searchTerm || Object.keys(filters).length > 0
                                ? 'Try adjusting your search criteria or clear the filters to see all items.'
                                : 'Create your first item using the button above.'}
                        </p>
                    </div>
                    
                    {pagination && renderPagination()}
                </div>
                {renderEditor()}
            </>
        );
    }

    // Loading state
    if (loading) {
        return (
            <>
                <div className="entity-table-container">
                    {renderSearchAndFilters()}
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                {renderEditor()}
            </>
        );
    }

    // Main table
    return (
        <>
            <div className="entity-table-container">
                {renderSearchAndFilters()}
                
                <div className="table-responsive">
                    <div className="table-container">
                        <table className="table table-striped table-hover" id={tableId}>
                            <thead className="table-dark">
                                <tr>
                                    {columns.map((col, index) => (
                                        <th 
                                            className={`text-nowrap table-text ${col.sortable ? 'sortable-header' : ''}`}
                                            key={index}
                                            style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                                            onClick={() => col.sortable && handleColumnSort(col.sortField || col.field)}
                                            title={col.sortable ? `Ordenar por ${col.header}` : undefined}
                                        >
                                            <div className='table-text-content d-flex align-items-center justify-content-between gap-2'>
                                                {col.header}
                                                {renderSortIndicator(col)}
                                            </div>
                                        </th>
                                    ))}
                                    {
                                        (showActionButtons || showCustomActions) ? (
                                            <th>Acciones</th>
                                        ) : (
                                            <th></th>
                                        )
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {entities.map((entity) => (
                                    <tr 
                                        className={ onClick ? 'clickable' : '' } 
                                        key={entity.id} 
                                        style={getRowStyle ? getRowStyle(entity) : {}}
                                    >
                                        {columns.map((col, index) => (
                                            <td className="table-text" key={index} onClick={() => onClick && onClick(entity)}>
                                                {renderTableCell(entity, col)}
                                            </td>
                                        ))}
                                        <td>
                                            {renderActionButtons(entity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {pagination && renderPagination()}
            </div>
            {renderEditor()}
        </>
    );
});

export default EntityTable; 