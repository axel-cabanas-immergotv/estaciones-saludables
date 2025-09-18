import { useState, useEffect, useRef } from 'react';
import WebsiteBuilder from '../WebsiteBuilder';
import './dynamicPage.css';

/**
 * DynamicPage Component
 * Full-screen page editor with sidebar panels for configuration
 * Supports multiple field types including custom fields
 * 
 * Supports advanced custom fields with multiple approaches:
 * - render function (recommended)
 * - component reference with props
 * - pre-rendered elements (legacy)
 * - conditional rendering with show property
 * 
 * See README.md for complete usage examples and patterns.
 */

// Skeleton component for loading state
const FieldSkeleton = ({ type = 'text' }) => {
    switch (type) {
        case 'text':
        case 'email':
        case 'url':
        case 'select':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-field"></div>
                </div>
            );
        case 'textarea':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-textarea"></div>
                </div>
            );
        case 'checkbox':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-checkbox">
                        <div className="skeleton-checkbox-input"></div>
                        <div className="skeleton-checkbox-label"></div>
                    </div>
                </div>
            );
        case 'editor':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-editor"></div>
                </div>
            );
        case 'custom':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-field"></div>
                </div>
            );
        case 'title':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-title"></div>
                </div>
            );
        default:
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-field"></div>
                </div>
            );
    }
};

const DynamicPage = ({
    show = false,
    title = "Edit Item",
    config = {},
    entityData = null,
    onSave = null,
    onCancel = null,
    loading = false
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Extract configuration
    const {
        fields = [],
        entityType = 'entity',
        editorConfig = null,
        customValidation = null
    } = config;

    // Initialize form data
    useEffect(() => {
        if (entityData) {
            setFormData({ ...entityData });
        } else {
            // Initialize with default values from field configuration
            const defaultData = {};
            fields.forEach(field => {
                defaultData[field.name] = field.defaultValue || '';
            });
            setFormData(defaultData);
        }
        setErrors({});
    }, [entityData, fields]);

    // Check if has content field for WebsiteBuilder
    const hasContentField = () => {
        return fields.some(field => field.type === 'editor');
    };

    // Handle WebsiteBuilder onChange
    const handleWebsiteBuilderChange = (updatedContent) => {
        console.log('DynamicPage handleWebsiteBuilderChange called:', updatedContent);
        // updatedContent is now the JSON output for the specific field
        // It can be an array of blocks, or a structured object depending on fieldKey
        setFormData(prev => {
            const newFormData = {
                ...prev,
                content: updatedContent
            };
            console.log('DynamicPage updated formData:', newFormData);
            return newFormData;
        });
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Auto-generate slug from title if needed
        if (fieldName === 'title' && !formData.slug && fields.find(f => f.name === 'slug')) {
            const slug = generateSlug(value);
            setFormData(prev => ({
                ...prev,
                [fieldName]: value,
                slug: slug
            }));
        }

        // Clear error for this field
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const validateForm = () => {
        const newErrors = {};

        // Run built-in validations
        fields.forEach(field => {
            const value = formData[field.name];

            if (field.required && (!value || value.toString().trim() === '')) {
                newErrors[field.name] = `${field.label} is required`;
            }

            if (field.validation) {
                const validationResult = field.validation(value, formData);
                if (validationResult !== true) {
                    newErrors[field.name] = validationResult;
                }
            }
        });

        // Run custom validation if provided
        if (customValidation) {
            const customErrors = customValidation(formData);
            Object.assign(newErrors, customErrors);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            // Content is already synced from WebsiteBuilder onChange

            // Apply onBeforeSave if available
            let dataToSave = formData;
            if (config.onBeforeSave) {
                dataToSave = config.onBeforeSave(formData);
            }

            if (onSave) {
                await onSave(dataToSave);
            } else {
                console.error('DynamicPage: No onSave function provided');
            }
        } catch (error) {
            console.error('DynamicPage: Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    // 100% Configurable panels system - completely agnostic
    const panels = config.panels || {};
    
    // Initialize grouped fields dynamically based on configured panels only
    const groupedFields = {};
    Object.keys(panels).forEach(panelKey => {
        groupedFields[panelKey] = [];
    });

    // Group fields based on their panel property - NO fallback logic
    fields.forEach(field => {
        // Only use field.panel if specified and panel exists in config
        if (field.panel && panels[field.panel]) {
            groupedFields[field.panel].push(field);
        }
        // Alternative: Use field.group as alias for panel
        else if (field.group && panels[field.group]) {
            groupedFields[field.group].push(field);
        }
        // NO fallback - if no panel specified, field is not grouped
        // This ensures 100% explicit configuration
    });

    const renderField = (field) => {
        // Show skeleton if loading and no data available
        if (loading && !entityData) {
            return <FieldSkeleton type={field.type} />;
        }

        const value = formData[field.name] || '';
        const hasError = errors[field.name];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
                return (
                    <input
                        type={field.type}
                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                        rows={field.rows || 3}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        style={field.name === 'custom_css' ? { fontFamily: 'monospace', fontSize: '12px' } : {}}
                    />
                );

            case 'select':
                return (
                    <select
                        className={`form-select ${hasError ? 'is-invalid' : ''}`}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                    >
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!value}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                        />
                        <label className="form-check-label">
                            {field.checkboxLabel || field.label}
                        </label>
                    </div>
                );

            case 'editor': {
                // Parse content if it's a string or use default structure
                let pageData = {
                    id: formData.id || 'temp-page',
                    title: formData.title || 'Untitled Page',
                    slug: formData.slug || 'untitled-page',
                    content: [],
                    status: formData.status || 'draft'
                };

                if (typeof value === 'string' && value) {
                    try {
                        const parsedContent = JSON.parse(value);
                        // If parsedContent is an array, use it directly
                        // If it's an object with blocks/content, extract the array
                        if (Array.isArray(parsedContent)) {
                            pageData.content = parsedContent;
                        } else if (parsedContent && typeof parsedContent === 'object') {
                            pageData.content = parsedContent.blocks || parsedContent.content || [];
                        }
                    } catch (e) {
                        console.warn('Error parsing content JSON:', e);
                        pageData.content = [];
                    }
                } else if (Array.isArray(value)) {
                    pageData.content = value;
                } else if (value && typeof value === 'object') {
                    // If value is already an object, extract content array
                    pageData.content = value.blocks || value.content || [];
                }

                console.log('DynamicPage editor field - pageData:', pageData);

                return (
                    <div className="website-builder-field">
                        <WebsiteBuilder
                            page={pageData}
                            fieldKey={field.name} // Use the field name as the key
                            generateOutput={true} // Generate JSON output for the field
                            onPageUpdate={handleWebsiteBuilderChange}
                            onSave={(pageData) => {
                                // This will be called when user clicks save in WebsiteBuilder
                                // but we handle the save through the main form save button
                                console.log('WebsiteBuilder save clicked:', pageData);
                            }}
                        />
                    </div>
                );
            }
            case 'custom':
                // Custom field supports multiple approaches:
                // 1. render function: (value, onChange, formData) => JSX
                // 2. component: React component class/function
                // 3. element: pre-rendered JSX element (legacy)
                // 4. conditional rendering based on field.show property
                
                // Check if field should be shown
                if (field.show && typeof field.show === 'function' && !field.show(formData, field)) {
                    return null; // Don't render this field
                }
                
                if (field.render) {
                    return field.render(value, (newValue) => handleInputChange(field.name, newValue), formData);
                } else if (field.component) {
                    // Support for React component instances
                    const CustomComponent = field.component;
                    return (
                        <CustomComponent
                            value={value}
                            onChange={(newValue) => handleInputChange(field.name, newValue)}
                            formData={formData}
                            field={field}
                            {...field.props}
                        />
                    );
                } else if (field.element) {
                    // Support for pre-rendered elements (legacy support)
                    return field.element;
                } else {
                    return <p className="text-muted">Custom field configuration incomplete. Provide render function, component, or element.</p>;
                }

            default:
                return (
                    <input
                        type="text"
                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                );
        }
    };

        const renderSidebarPanel = (title, fields, show = true, panelKey = null) => {
        if (!show || fields.length === 0) return null;

        return (
            <div key={panelKey || title} className="panel-section">
                <h6 className="panel-title">{title.toUpperCase()}</h6>
                {fields.map(field => (
                    <div key={field.name} className="form-group mb-3">
                        {field.type !== 'checkbox' && !loading && (
                            <label className="form-label">{field.label}</label>
                        )}
                        {renderField(field)}
                        {field.helpText && !loading && (
                            <small className="form-text text-muted mt-1">{field.helpText}</small>
                        )}
                        {errors[field.name] && !loading && (
                            <div className="invalid-feedback d-block">
                                {errors[field.name]}
                            </div>
                        )}
                        {field.help && !loading && (
                            <div className="form-text">
                                {field.help}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (!show) return null;

    return (
        <div className="page-editor-container">
            {/* Editor Header */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <button className="btn btn-link editor-back-btn" onClick={handleCancel}>
                        <i className="fas fa-chevron-left me-2"></i>BACK
                    </button>
                    <h1 className="editor-title">
                        {loading && !entityData ? (
                            <div className="skeleton-header-title"></div>
                        ) : (
                            entityData ? `Edit ${entityType}` : `Create New ${entityType}`
                        )}
                    </h1>
                </div>
                
                <div className="editor-header-right">
                    {/* Status selector if exists */}
                    {fields.find(f => f.name === 'status') && (
                        loading && !entityData ? (
                            <div className="skeleton-status-selector me-2"></div>
                        ) : (
                            <select 
                                className="form-select me-2" 
                                style={{ width: 'auto' }}
                                value={formData.status || 'draft'}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        )
                    )}
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                SAVING...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-1"></i>SAVE
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Layout */}
            <div className="editor-layout">
                {/* Main Editor Area */}
                <div className="editor-main">
                    {loading && !entityData ? (
                        // Show skeleton loading for all main area fields
                        <>
                            {Object.keys(panels).map(panelKey => {
                                const panel = panels[panelKey];
                                if (!panel.showInMain || !groupedFields[panelKey] || groupedFields[panelKey].length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={panelKey} className="main-panel-section">
                                        {groupedFields[panelKey].map(field => (
                                            <div key={field.name} className="main-field mb-4">
                                                {field.name === 'title' || field.type === 'title' ? (
                                                    <div className="page-title-section p-4">
                                                        <FieldSkeleton type="text" />
                                                    </div>
                                                ) : field.type === 'editor' ? (
                                                    <div className="page-content-section">
                                                        <FieldSkeleton type="editor" />
                                                    </div>
                                                ) : (
                                                    <div className="p-4">
                                                        <FieldSkeleton type={field.type} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {/* Dynamic Main Area Fields */}
                            {Object.keys(panels).map(panelKey => {
                                const panel = panels[panelKey];
                                if (!panel.showInMain || !groupedFields[panelKey] || groupedFields[panelKey].length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={panelKey} className="main-panel-section">
                                        {groupedFields[panelKey].map(field => (
                                            <div key={field.name} className="main-field mb-4">
                                                {/* Special styling for title field */}
                                                {field.name === 'title' || field.type === 'title' ? (
                                                    <div className="page-title-section p-4">
                                                        {loading && !entityData ? (
                                                            <FieldSkeleton type="title" />
                                                        ) : (
                                                            <>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control form-control-lg border-0 p-0" 
                                                                    placeholder={field.placeholder || "Enter title..."}
                                                                    value={formData[field.name] || ''}
                                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                                    style={{ fontSize: '2.5rem', fontWeight: 'bold' }}
                                                                />
                                                                {errors[field.name] && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {errors[field.name]}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ) : field.type === 'editor' ? (
                                                    <div className="page-content-section">
                                                        {renderField(field)}
                                                    </div>
                                                ) : (
                                                    <div className="p-4">
                                                        {field.type !== 'custom' && !loading && (
                                                            <label className="form-label fw-bold mb-2">{field.label}</label>
                                                        )}
                                                        {renderField(field)}
                                                        {field.helpText && !loading && (
                                                            <small className="form-text text-muted mt-1">{field.helpText}</small>
                                                        )}
                                                        {errors[field.name] && !loading && (
                                                            <div className="invalid-feedback d-block">
                                                                {errors[field.name]}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="editor-sidebar">
                    <div className="sidebar-panel">
                        {/* Dynamic Sidebar Panels */}
                        {Object.keys(panels).map(panelKey => {
                            const panel = panels[panelKey];
                            if (!panel.showInSidebar || !groupedFields[panelKey] || groupedFields[panelKey].length === 0) {
                                return null;
                            }

                            return renderSidebarPanel(panel.title, groupedFields[panelKey], true, panelKey);
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicPage; 