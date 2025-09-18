/**
 * DynamicStory Component
 * Full-screen story editor optimized for narrative content
 * Features minimal sidebar with basic configurations
 * Maintains admin sidebar (unlike DynamicPage)
 * 
 * Supports advanced custom fields with multiple approaches:
 * - render function (recommended)
 * - component reference with props
 * - pre-rendered elements (legacy)
 * - conditional rendering with show property
 * 
 * See README.md for complete usage examples and patterns.
 */
import { useState, useEffect, useRef } from 'react';
import RichEditor from '../RichEditor';
import BlockPalette from '../RichEditor/BlockPalette';
import './dynamicStory.css';

// Skeleton component for loading state
const FieldSkeleton = ({ type = 'text' }) => {
    switch (type) {
        case 'text':
        case 'email':
        case 'url':
        case 'select':
        case 'number':
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
        case 'file':
            return (
                <div className="skeleton-input">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-file"></div>
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

const DynamicStory = ({
    show = false,
    title = "Edit Story",
    config = {},
    entityData = null,
    onSave = null,
    onCancel = null,
    loading = false
}) => {

    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [asyncOptions, setAsyncOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState({});
    const [activeTab, setActiveTab] = useState(0); // Index of active tab

    // Extract configuration
    const {
        fields = [],
        entityType = 'story',
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

    // Load async options for fields that need them
    useEffect(() => {
        fields.forEach(field => {
            if (field.async && field.loadOptions) {
                loadAsyncOptions(field.name, field.loadOptions);
            }
        });
    }, [fields]);

    // Check if has content field for text editor
    const hasContentField = () => {
        return fields.some(field => field.type === 'editor');
    };

    // Handle text editor onChange
    const handleEditorChange = (content) => {
        handleInputChange('content', content);
    };

    // Load async options for select fields
    const loadAsyncOptions = async (fieldName, loadOptionsFn) => {
        // Validate parameters
        if (!fieldName || !loadOptionsFn || typeof loadOptionsFn !== 'function' || asyncOptions[fieldName]) {
            console.error(`loadAsyncOptions: Invalid parameters for ${fieldName}`, {
                fieldName,
                loadOptionsFn,
                asyncOptions,
                isLoaded: asyncOptions[fieldName]
            })
            return;
        };

        setLoadingOptions(prev => ({ ...prev, [fieldName]: true }));
        try {
            const options = await loadOptionsFn();
            // Validate options format
            if (!Array.isArray(options)) {
                console.error(`loadAsyncOptions: Invalid options format for ${fieldName}`, options);
                setAsyncOptions(prev => ({ ...prev, [fieldName]: [] }));
                return;
            }
            
            setAsyncOptions(prev => ({ ...prev, [fieldName]: options }));
        } catch (error) {
            console.error(`Error loading options for ${fieldName}:`, error);
            // Set empty array on error to prevent infinite retries
            setAsyncOptions(prev => ({ ...prev, [fieldName]: [] }));
        } finally {
            setLoadingOptions(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    // Handle input changes
    const handleInputChange = (fieldName, value) => {
        // Convert number fields to proper type
        let processedValue = value;
        const field = fields.find(f => f.name === fieldName);
        if (field && field.type === 'number') {
            if (value === '' || value === null || value === undefined) {
                processedValue = field.defaultValue || 0;
            } else {
                processedValue = parseInt(value) || field.defaultValue || 0;
            }
        }

        setFormData(prev => ({
            ...prev,
            [fieldName]: processedValue
        }));

        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Validate required fields
        fields.forEach(field => {
            if (field.required && (!formData[field.name] || formData[field.name] === '')) {
                newErrors[field.name] = `${field.label} is required`;
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

    // Handle save
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setSaving(true);
        
        try {
            // Get latest editor data if editor exists
            let finalData = { ...formData };
            // Content is already in formData from handleEditorChange

            // Apply onBeforeSave if available
            let dataToSave = finalData;
            if (config.onBeforeSave) {
                dataToSave = config.onBeforeSave(finalData);
            }

            if (onSave) {
                await onSave(dataToSave);
            } else {
                console.error('DynamicStory: No onSave function provided');
            }
        } catch (error) {
            console.error('DynamicStory: Save failed:', error);
            setErrors({ general: error.message || 'Save failed. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    // 100% Configurable panels system - completely agnostic
    const panels = config.panels || {};
    
    // Initialize grouped fields dynamically based on configured panels
    const groupedFields = {};
    
    // Handle main panel (if exists)
    if (panels.main) {
        groupedFields.main = [];
        // Add main fields from config
        if (fields) {
            fields.forEach(field => {
                if (field.panel === 'main') {
                    groupedFields.main.push(field);
                }
            });
        }
    }
    
    // Handle tabbed panels - extract fields from panel configuration
    if (panels.tabs && Array.isArray(panels.tabs)) {
        panels.tabs.forEach(tab => {
            if (tab.fields) {
                Object.keys(tab.fields).forEach(panelKey => {
                    const panel = tab.fields[panelKey];
                    groupedFields[panelKey] = panel.fields || [];
                });
            }
        });
    }
    
    // Extract tabs configuration
    const tabs = panels.tabs || [];
    const currentTab = tabs[activeTab] || tabs[0];
    const currentTabPanels = currentTab?.fields || {};

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
                        value={value || ''}
                        placeholder={field.placeholder}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                        value={value || ''}
                        placeholder={field.placeholder || '0'}
                        min={field.min || 0}
                        step={field.step || 1}
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
                    />
                );

            case 'select': {
                // Handle async options
                const options = field.async ? (asyncOptions[field.name] || []) : (field.options || []);
                const isLoading = loadingOptions[field.name] || false;

                // Load async options if needed
                if (field.async && field.loadOptions && !asyncOptions[field.name] && !isLoading) {
                    if (typeof field.loadOptions === 'function') {
                        loadAsyncOptions(field.name, field.loadOptions);
                    } else {
                        console.error(`Invalid loadOptions for field ${field.name}:`, field.loadOptions);
                    }
                }

                return (
                    <div>
                        <select
                            className={`form-select ${hasError ? 'is-invalid' : ''}`}
                            value={value || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            disabled={isLoading}
                        >
                            <option value="">{field.placeholder || 'Select...'}</option>
                            {Array.isArray(options) && options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {isLoading && (
                            <small className="text-muted">Loading options...</small>
                        )}
                        {!isLoading && field.async && options.length === 0 && (
                            <small className="text-muted">No options available</small>
                        )}
                    </div>
                );
            }

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
                return (
                    <RichEditor
                        value={value}
                        onChange={(newValue) => handleInputChange(field.name, newValue)}
                    />
                );
            }

            case 'file':
                return (
                    <div className="file-upload-container">
                        <input
                            type="file"
                            className={`form-control ${hasError ? 'is-invalid' : ''}`}
                            accept={field.accept || '*'}
                            onChange={(e) => handleInputChange(field.name, e.target.files[0])}
                        />
                        {value && (
                            <div className="mt-2">
                                <small className="text-muted">Current file: {typeof value === 'string' ? value : value?.name}</small>
                            </div>
                        )}
                    </div>
                );

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
            <div key={panelKey || title} className="story-panel-section">
                <h6 className="story-panel-title">{title.toUpperCase()}</h6>
                {fields.map(field => (
                    <div key={field.name} className="form-group mb-3">
                        {field.type !== 'checkbox' && !loading && (
                            <label className="form-label">{field.label}</label>
                        )}
                        {renderField(field)}
                        {field.helpText && !loading && (
                            <small className="form-text text-muted">{field.helpText}</small>
                        )}
                        {errors[field.name] && !loading && (
                            <div className="invalid-feedback d-block">
                                {errors[field.name]}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };
    
    const renderSidebarContent = () => {
        const currentTab = tabs[activeTab];
        if (!currentTab || !currentTab.fields) return null;
        
        return Object.keys(currentTab.fields).map(panelKey => {
            const panel = currentTab.fields[panelKey];
            if (!panel.showInSidebar || !groupedFields[panelKey] || groupedFields[panelKey].length === 0) {
                return null;
            }
            return renderSidebarPanel(panel.title, groupedFields[panelKey], true, panelKey);
        });
    };

    if (!show) return null;

    return (
        <div className="dynamic-story-overlay">
            <div className="dynamic-story-container">
                {/* Story Header */}
                <div className="story-header">
                    <div className="story-header-left">
                        <button 
                            className="btn btn-link story-back-btn" 
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            <i className="fas fa-chevron-left me-2"></i>BACK
                        </button>
                        <h1 className="story-title">
                            {loading && !entityData ? (
                                <div className="skeleton-header-title"></div>
                            ) : (
                                title
                            )}
                        </h1>
                    </div>
                    
                    <div className="story-header-right">
                        <button 
                            className="btn btn-primary story-save-btn" 
                            onClick={handleSave}
                            disabled={saving || loading}
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                    SAVING...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-1"></i>
                                    SAVE
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Story Layout */}
                <div className="story-layout">
                    {/* Main Story Area */}
                    <div className="story-main">
                        <div className="story-content">
                            {errors.general && (
                                <div className="alert alert-danger mb-3">
                                    {errors.general}
                                </div>
                            )}
                            
                            {/* Dynamic Main Area Fields */}
                            {Object.keys(panels).map(panelKey => {
                                const panel = panels[panelKey];
                                if (!panel.showInMain || !groupedFields[panelKey] || groupedFields[panelKey].length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={panelKey} className="story-main-panel">
                                        {groupedFields[panelKey].map(field => (
                                            <div key={field.name} className="story-field mb-4">
                                                {field.type !== 'editor' && field.type !== 'custom' && !loading && (
                                                    <label className="story-field-label">{field.label}</label>
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
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Minimal Story Sidebar */}
                    <div className="story-sidebar">
                        {/* Sidebar Tabs */}
                        <div className="story-sidebar-tabs">
                            {tabs.map((tab, index) => (
                                <button
                                    key={index}
                                    className={`story-tab-btn ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => setActiveTab(index)}
                                    disabled={loading}
                                >
                                    <i className={`fas ${index === 0 ? 'fa-info-circle' : 'fa-edit'} me-2`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="story-sidebar-content">
                            {/* Dynamic Sidebar Panels based on active tab */}
                            {renderSidebarContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicStory; 