import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Select from 'react-select';
import './selectWrapper.css';

const SelectWrapper = ({
    // Basic props
    options = [],
    value,
    onChange,
    placeholder = 'Seleccionar...',
    isDisabled = false,
    isLoading = false,
    
    // Selection props
    isMulti = false,
    isClearable = true,
    isSearchable = true,
    
    // Search props
    onInputChange,
    filterOption,
    noOptionsMessage = () => 'No hay opciones disponibles',
    
    // API loading props
    loadOptions,
    loadAllOnMount = false,
    defaultOptions = [],
    
    // Styling props
    className = '',
    customStyles = {},
    theme = 'default',
    
    // Advanced props
    closeMenuOnSelect = true,
    blurInputOnSelect = true,
    captureMenuScroll = true,
    hideSelectedOptions = false,
    
    // Callbacks
    onBlur,
    onFocus,
    onMenuOpen,
    onMenuClose,
    
    // Custom components
    components = {},
    
    // Error handling
    hasError = false,
    errorMessage = '',
    
    // Label and help text
    label,
    helpText,
    
    // Required field
    required = false,
    
    // Custom props
    ...otherProps
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localOptions, setLocalOptions] = useState(options);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [hasLoadedAll, setHasLoadedAll] = useState(false);
    
    // Load all options when component mounts if loadAllOnMount is true and isSearchable is false
    useEffect(() => {
        if (loadAllOnMount && !isSearchable && loadOptions && !hasLoadedAll) {
            loadAllOptions();
        }
    }, [loadAllOnMount, isSearchable, loadOptions, hasLoadedAll]);
    
    // Update local options when options prop changes
    useEffect(() => {
        setLocalOptions(options);
    }, [options]);
    
    // Load all options without search
    const loadAllOptions = useCallback(async () => {
        if (!loadOptions || hasLoadedAll) return;
        
        setIsLoadingOptions(true);
        try {
            const allOptions = await loadOptions('', { action: 'load-all' });
            setLocalOptions(allOptions || []);
            setHasLoadedAll(true);
        } catch (error) {
            console.error('Error loading all options:', error);
        } finally {
            setIsLoadingOptions(false);
        }
    }, [loadOptions, hasLoadedAll]);
    
    // Handle input change with API loading
    const handleInputChange = useCallback((inputValue, { action }) => {
        // If not searchable and we have loadOptions, load all options on first input
        if (!isSearchable && loadOptions && !hasLoadedAll && action === 'input-change') {
            loadAllOptions();
        }
        
        if (onInputChange) {
            onInputChange(inputValue, { action });
        }
    }, [isSearchable, loadOptions, hasLoadedAll, loadAllOptions, onInputChange]);
    
    // Handle menu open to load options if needed
    const handleMenuOpen = useCallback(() => {
        // If not searchable and we have loadOptions, load all options when menu opens
        if (!isSearchable && loadOptions && !hasLoadedAll) {
            loadAllOptions();
        }
        
        if (onMenuOpen) {
            onMenuOpen();
        }
    }, [isSearchable, loadOptions, hasLoadedAll, loadAllOptions, onMenuOpen]);
    
    // Memoize default styles based on theme
    const defaultStyles = useMemo(() => {
        const baseStyles = {
            control: (provided, state) => ({
                ...provided,
                minHeight: '38px',
                border: state.isFocused 
                    ? '2px solid #1890ff' 
                    : hasError 
                        ? '2px solid #ff4d4f' 
                        : '1px solid #d9d9d9',
                borderRadius: '6px',
                boxShadow: state.isFocused 
                    ? '0 0 0 2px rgba(24, 144, 255, 0.2)' 
                    : 'none',
                '&:hover': {
                    borderColor: state.isFocused ? '#1890ff' : '#40a9ff'
                }
            }),
            option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected 
                    ? '#1890ff' 
                    : state.isFocused 
                        ? '#e6f7ff' 
                        : 'transparent',
                color: state.isSelected ? 'white' : '#262626',
                cursor: 'pointer',
                padding: '8px 12px',
                '&:active': {
                    backgroundColor: '#1890ff'
                }
            }),
            multiValue: (provided) => ({
                ...provided,
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                padding: '2px 6px'
            }),
            multiValueLabel: (provided) => ({
                ...provided,
                color: '#262626',
                fontSize: '12px'
            }),
            multiValueRemove: (provided) => ({
                ...provided,
                color: '#8c8c8c',
                '&:hover': {
                    backgroundColor: '#ff4d4f',
                    color: 'white'
                }
            }),
            placeholder: (provided) => ({
                ...provided,
                color: '#8c8c8c'
            }),
            singleValue: (provided) => ({
                ...provided,
                color: '#262626'
            }),
            input: (provided) => ({
                ...provided,
                margin: '0px'
            }),
            menu: (provided) => ({
                ...provided,
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #d9d9d9',
                borderRadius: '6px'
            }),
            menuList: (provided) => ({
                ...provided,
                padding: '4px 0'
            })
        };
        
        // Apply theme variations
        if (theme === 'minimal') {
            baseStyles.control = (provided, state) => ({
                ...baseStyles.control(provided, state),
                border: 'none',
                borderBottom: state.isFocused 
                    ? '2px solid #1890ff' 
                    : hasError 
                        ? '2px solid #ff4d4f' 
                        : '1px solid #e8e8e8',
                borderRadius: '0',
                boxShadow: 'none'
            });
        }
        
        return baseStyles;
    }, [theme, hasError]);
    
    // Merge custom styles with default styles
    const mergedStyles = useMemo(() => {
        return {
            ...defaultStyles,
            ...customStyles
        };
    }, [defaultStyles, customStyles]);
    
    // Handle value change
    const handleChange = useCallback((selectedOption) => {
        if (onChange) {
            onChange(selectedOption);
        }
    }, [onChange]);
    
    // Handle focus
    const handleFocus = useCallback((event) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);
    
    // Handle blur
    const handleBlur = useCallback((event) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);
    
    // Custom no options message
    const customNoOptionsMessage = useCallback(() => {
        if (typeof noOptionsMessage === 'function') {
            return noOptionsMessage();
        }
        return noOptionsMessage;
    }, [noOptionsMessage]);
    
    // Determine if we should show loading state
    const showLoading = isLoading || isLoadingOptions;
    
    // Use local options or default options
    const finalOptions = localOptions.length > 0 ? localOptions : defaultOptions;
    
    return (
        <div className={`select-wrapper ${className} ${hasError ? 'select-wrapper--error' : ''}`}>
            {label && (
                <label className="select-wrapper__label">
                    {label}
                    {required && <span className="select-wrapper__required">*</span>}
                </label>
            )}
            
            <Select
                options={finalOptions}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                isDisabled={isDisabled}
                isLoading={showLoading}
                isMulti={isMulti}
                isClearable={isClearable}
                isSearchable={isSearchable}
                onInputChange={handleInputChange}
                filterOption={filterOption}
                noOptionsMessage={customNoOptionsMessage}
                styles={mergedStyles}
                closeMenuOnSelect={closeMenuOnSelect}
                blurInputOnSelect={blurInputOnSelect}
                captureMenuScroll={captureMenuScroll}
                hideSelectedOptions={hideSelectedOptions}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onMenuOpen={handleMenuOpen}
                onMenuClose={onMenuClose}
                components={components}
                classNamePrefix="select-wrapper"
                {...otherProps}
            />
            
            {helpText && (
                <div className="select-wrapper__help-text">
                    {helpText}
                </div>
            )}
            
            {hasError && errorMessage && (
                <div className="select-wrapper__error-message">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default SelectWrapper;
