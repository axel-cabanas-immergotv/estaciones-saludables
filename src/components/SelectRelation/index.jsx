import React, { useState, useEffect, useCallback, useRef } from 'react';
import './selectRelation.css';

/**
 * SelectRelation Component - Advanced entity relationship selector with Select2-like features
 * 
 * @param {Object} props
 * @param {string} props.entity - Entity table name to search in
 * @param {string} props.apiURL - API endpoint to fetch data from
 * @param {string} props.key - Field to use as value/key
 * @param {string} props.label - Field to display as label
 * @param {Object} props.filter - Additional filters to apply to the API request
 * @param {boolean} props.multiple - Whether multiple selections are allowed
 * @param {Array} props.selectedItems - Currently selected items
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.fieldLabel - Label for the form field
 * @param {string} props.placeholder - Placeholder text for the input
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the component is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * 
 * // Select2-like features
 * @param {Object} props.ajax - AJAX configuration object
 * @param {boolean} props.allowClear - Allows clearing selection
 * @param {string} props.amdLanguageBase - Base path for AMD language files
 * @param {boolean} props.closeOnSelect - Closes dropdown on selection
 * @param {Array} props.data - Local data array
 * @param {Object} props.dataAdapter - Custom data adapter class
 * @param {boolean} props.debug - Enables debug messages
 * @param {string} props.dir - Text direction: "ltr" or "rtl"
 * @param {Object} props.dropdownAdapter - Custom dropdown adapter class
 * @param {boolean} props.dropdownAutoWidth - Auto-adjusts dropdown width
 * @param {string} props.dropdownCssClass - Extra CSS classes for dropdown
 * @param {Element} props.dropdownParent - Parent element for dropdown in DOM
 * @param {Function} props.escapeMarkup - Custom HTML escape function
 * @param {string|Object} props.language - Language for interface messages
 * @param {Function} props.matcher - Custom search logic
 * @param {number} props.maximumInputLength - Maximum characters allowed in search
 * @param {number} props.maximumSelectionLength - Maximum selectable items
 * @param {number} props.minimumInputLength - Minimum characters to trigger search
 * @param {number} props.minimumResultsForSearch - Minimum results to show search
 * @param {Object} props.resultsAdapter - Custom results adapter class
 * @param {Object} props.selectionAdapter - Custom selection adapter class
 * @param {string} props.selectionCssClass - Extra CSS classes for selection
 * @param {boolean} props.selectOnClose - Selects on dropdown close
 * @param {boolean} props.tags - Allows adding new options
 * @param {Function} props.templateResult - Results list template function
 * @param {Function} props.templateSelection - Selected items template function
 * @param {string} props.theme - Visual theme
 * @param {Array} props.tokenSeparators - Separators for creating items from text
 * @param {string} props.width - Control width
 */
const SelectRelation = ({
    entity,
    apiURL,
    key: keyField = 'id',
    label: labelField = 'name',
    filter = {},
    multiple = false,
    selectedItems = [],
    onChange,
    fieldLabel,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    style = {},
    
    // Select2-like features
    ajax = null,
    allowClear = false,
    amdLanguageBase = './i18n/',
    closeOnSelect = true,
    data = null,
    dataAdapter = null,
    debug = false,
    dir = 'ltr',
    dropdownAdapter = null,
    dropdownAutoWidth = false,
    dropdownCssClass = '',
    dropdownParent = null,
    escapeMarkup = null,
    language = 'en',
    matcher = null,
    maximumInputLength = null,
    maximumSelectionLength = null,
    minimumInputLength = 0,
    minimumResultsForSearch = 0,
    resultsAdapter = null,
    selectionAdapter = null,
    selectionCssClass = '',
    selectOnClose = false,
    tags = false,
    templateResult = null,
    templateSelection = null,
    theme = 'default',
    tokenSeparators = [],
    width = '100%'
}) => {
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Debug logging
    const log = useCallback((message, data = null) => {
        if (debug) {
            console.log(`[SelectRelation] ${message}`, data);
        }
    }, [debug]);

    // Language support
    const getLanguageText = useCallback((key) => {
        const defaultTexts = {
            en: {
                noResults: 'No results found',
                searching: 'Searching...',
                loading: 'Loading...',
                error: 'Error loading data',
                inputTooShort: 'Please enter more characters',
                inputTooLong: 'Please enter fewer characters',
                maximumSelected: 'You can only select {0} items'
            },
            es: {
                noResults: 'No se encontraron resultados',
                searching: 'Buscando...',
                loading: 'Cargando...',
                error: 'Error al cargar datos',
                inputTooShort: 'Por favor ingrese más caracteres',
                inputTooLong: 'Por favor ingrese menos caracteres',
                maximumSelected: 'Solo puede seleccionar {0} elementos'
            }
        };

        const lang = typeof language === 'string' ? language : 'en';
        const texts = typeof language === 'object' ? language : defaultTexts[lang] || defaultTexts.en;
        
        if (typeof texts[key] === 'function') {
            return texts[key]();
        }
        
        return texts[key] || defaultTexts.en[key] || key;
    }, [language]);

    // Load available items on component mount and when filters change
    useEffect(() => {
        if (data) {
            // Use local data
            setAvailableItems(data);
            setFilteredItems(data);
        } else if (ajax || apiURL) {
            loadAvailableItems();
        }
    }, [entity, apiURL, filter, data, ajax]);

    // Filter items based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredItems(availableItems);
        } else {
            let filtered = availableItems;
            
            // Use custom matcher if provided
            if (matcher) {
                filtered = availableItems.filter(item => 
                    matcher({ term: searchTerm }, item)
                );
            } else {
                // Default filtering
                filtered = availableItems.filter(item => 
                    String(item[labelField] || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            setFilteredItems(filtered);
        }
    }, [searchTerm, availableItems, labelField, matcher]);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                if (selectOnClose && focusedIndex >= 0 && filteredItems[focusedIndex]) {
                    handleItemSelect(filteredItems[focusedIndex]);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [focusedIndex, filteredItems, selectOnClose]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.length >= minimumInputLength) {
            searchTimeoutRef.current = setTimeout(() => {
                if (searchTerm.trim() !== '') {
                    searchItems(searchTerm);
                }
            }, ajax?.delay || 250);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, ajax, minimumInputLength]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!showDropdown) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setFocusedIndex(prev => 
                        prev < filteredItems.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (focusedIndex >= 0 && filteredItems[focusedIndex]) {
                        handleItemSelect(filteredItems[focusedIndex]);
                    }
                    break;
                case 'Escape':
                    setShowDropdown(false);
                    setFocusedIndex(-1);
                    break;
                case 'Tab':
                    setShowDropdown(false);
                    setFocusedIndex(-1);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showDropdown, focusedIndex, filteredItems]);

    const loadAvailableItems = useCallback(async () => {
        if (!ajax && !apiURL) return;
        
        setLoading(true);
        setError(null);
        
        try {
            let items = [];
            
            if (ajax) {
                // Use AJAX configuration
                const params = {
                    ...filter
                };
                
                const ajaxData = ajax.data ? ajax.data(params) : params;
                const response = await fetch(ajax.url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(ajax.headers || {})
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const responseData = await response.json();
                items = ajax.processResults ? ajax.processResults(responseData).results : responseData;
            } else {
                // Use standard API URL
                const queryParams = new URLSearchParams(filter);
                const response = await fetch(`${apiURL}?${queryParams}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const responseData = await response.json();
                items = Array.isArray(responseData) ? responseData : (responseData.items || responseData.data || []);
            }
            
            setAvailableItems(items);
            setFilteredItems(items);
            log('Items loaded', { count: items.length });
        } catch (error) {
            console.error(`Error loading ${entity} items:`, error);
            setError(getLanguageText('error'));
            log('Error loading items', error);
        } finally {
            setLoading(false);
        }
    }, [ajax, apiURL, filter, entity, log, getLanguageText]);

    const searchItems = useCallback(async (searchTerm) => {
        if (!ajax && !apiURL) return;
        
        setLoading(true);
        setError(null);
        
        try {
            let items = [];
            
            if (ajax) {
                // Use AJAX configuration for search
                const params = {
                    search: searchTerm,
                    ...filter
                };
                
                const ajaxData = ajax.data ? ajax.data(params) : params;
                const response = await fetch(ajax.url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(ajax.headers || {})
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const responseData = await response.json();
                items = ajax.processResults ? ajax.processResults(responseData).results : responseData;
            } else {
                // Use standard API URL for search
                const queryParams = new URLSearchParams({
                    search: searchTerm,
                    ...filter
                });

                const response = await fetch(`${apiURL}?${queryParams}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const responseData = await response.json();
                items = Array.isArray(responseData) ? responseData : (responseData.items || responseData.data || []);
            }
            
            setAvailableItems(items);
            setFilteredItems(items);
            log('Search completed', { term: searchTerm, results: items.length });
        } catch (error) {
            console.error(`Error searching ${entity} items:`, error);
            setError(getLanguageText('error'));
            log('Search error', error);
        } finally {
            setLoading(false);
        }
    }, [ajax, apiURL, filter, entity, log, getLanguageText]);

    const handleItemSelect = (item) => {
        // Check maximum selection length
        if (multiple && maximumSelectionLength && selectedItems.length >= maximumSelectionLength) {
            log('Maximum selection reached', { max: maximumSelectionLength });
            return;
        }

        if (multiple) {
            // Check if item is already selected
            const isSelected = selectedItems.some(selected => selected[keyField] === item[keyField]);
            
            if (isSelected) {
                // Remove item
                const newSelection = selectedItems.filter(selected => selected[keyField] !== item[keyField]);
                onChange(newSelection);
            } else {
                // Add item
                const newSelection = [...selectedItems, item];
                onChange(newSelection);
            }
        } else {
            // Single selection
            onChange([item]);
            if (closeOnSelect) {
                setShowDropdown(false);
            }
        }
        
        setSearchTerm('');
        setFocusedIndex(-1);
        log('Item selected', { item, multiple });
    };

    const handleItemRemove = (itemToRemove) => {
        const newSelection = selectedItems.filter(item => item[keyField] !== itemToRemove[keyField]);
        onChange(newSelection);
        log('Item removed', { item: itemToRemove });
    };

    const handleClearSelection = () => {
        onChange([]);
        setSearchTerm('');
        setFocusedIndex(-1);
        log('Selection cleared');
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        
        // Check maximum input length
        if (maximumInputLength && value.length > maximumInputLength) {
            return;
        }
        
        setInputValue(value);
        setSearchTerm(value);
        
        // Check minimum input length
        if (value.length < minimumInputLength) {
            setFilteredItems([]);
            return;
        }
    };

    const handleInputFocus = () => {
        if (!disabled) {
            setShowDropdown(true);
            setFocusedIndex(-1);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && tags && inputValue.trim()) {
            e.preventDefault();
            // Create new tag
            const newTag = {
                [keyField]: `tag_${Date.now()}`,
                [labelField]: inputValue.trim(),
                isNew: true
            };
            handleItemSelect(newTag);
            setInputValue('');
        }
    };

    const getSelectedDisplay = () => {
        if (selectedItems.length === 0) {
            return placeholder || `Select ${entity}...`;
        }
        
        if (multiple) {
            if (selectedItems.length === 1) {
                return templateSelection ? 
                    templateSelection(selectedItems[0]) : 
                    selectedItems[0][labelField];
            }
            return `${selectedItems.length} ${entity} selected`;
        }
        
        return templateSelection ? 
            templateSelection(selectedItems[0]) : 
            selectedItems[0][labelField];
    };

    const isItemSelected = (item) => {
        return selectedItems.some(selected => selected[keyField] === item[keyField]);
    };

    const shouldShowSearch = () => {
        if (minimumResultsForSearch === Infinity) return false;
        return availableItems.length > minimumResultsForSearch;
    };

    const renderItem = (item) => {
        if (templateResult) {
            return templateResult(item);
        }
        
        return (
            <span className="item-label">
                {escapeMarkup ? escapeMarkup(item[labelField]) : item[labelField]}
            </span>
        );
    };

    const renderSelectedItem = (item) => {
        if (templateSelection) {
            return templateSelection(item);
        }
        
        return item[labelField];
    };

    return (
        <div 
            className={`select-relation ${className} ${theme}`} 
            style={{ ...style, width, direction: dir }}
            ref={dropdownRef}
        >
            {fieldLabel && (
                <label className="select-relation-label">
                    {fieldLabel}
                    {required && <span className="required-indicator">*</span>}
                </label>
            )}
            
            <div className="select-relation-container">
                {/* Selected Items Display */}
                {multiple && selectedItems.length > 0 && (
                    <div className={`selected-items ${selectionCssClass}`}>
                        {selectedItems.map((item, index) => (
                            <span key={`${item[keyField]}-${index}`} className="selected-item">
                                {renderSelectedItem(item)}
                                <button
                                    type="button"
                                    className="remove-item"
                                    onClick={() => handleItemRemove(item)}
                                    disabled={disabled}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Input and Dropdown Container */}
                <div className="select-relation-dropdown-container">
                    <div className="input-container">
                        <input
                            type="text"
                            className="select-relation-input"
                            placeholder={getSelectedDisplay()}
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleInputKeyDown}
                            disabled={disabled}
                            maxLength={maximumInputLength}
                            minLength={minimumInputLength}
                        />
                        
                        {/* Clear Button */}
                        {allowClear && selectedItems.length > 0 && (
                            <button
                                type="button"
                                className="clear-selection"
                                onClick={handleClearSelection}
                                disabled={disabled}
                            >
                                ×
                            </button>
                        )}
                        
                        {/* Dropdown Toggle */}
                        <button
                            type="button"
                            className={`dropdown-toggle ${showDropdown ? 'active' : ''}`}
                            onClick={() => setShowDropdown(!showDropdown)}
                            disabled={disabled}
                        >
                            <i className={`fas fa-chevron-down ${showDropdown ? 'rotated' : ''}`}></i>
                        </button>
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className={`select-relation-dropdown ${dropdownCssClass}`}>
                            {/* Search Input (if needed) */}
                            {shouldShowSearch() && (
                                <div className="search-container">
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="error-message">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    {error}
                                </div>
                            )}

                            {/* Input Length Validation */}
                            {inputValue.length > 0 && inputValue.length < minimumInputLength && (
                                <div className="input-too-short">
                                    {getLanguageText('inputTooShort')}
                                </div>
                            )}

                            {maximumInputLength && inputValue.length > maximumInputLength && (
                                <div className="input-too-long">
                                    {getLanguageText('inputTooLong')}
                                </div>
                            )}

                            {/* Maximum Selection Warning */}
                            {multiple && maximumSelectionLength && selectedItems.length >= maximumSelectionLength && (
                                <div className="maximum-selected">
                                    {getLanguageText('maximumSelected').replace('{0}', maximumSelectionLength)}
                                </div>
                            )}

                            {/* Items List */}
                            <div className="items-list">
                                {loading ? (
                                    <div className="loading-item">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        {getLanguageText('loading')}
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="no-items">
                                        {searchTerm ? getLanguageText('noResults') : `No ${entity} available`}
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <button
                                            key={`${item[keyField]}-${index}`}
                                            type="button"
                                            className={`dropdown-item ${isItemSelected(item) ? 'selected' : ''} ${index === focusedIndex ? 'focused' : ''}`}
                                            onClick={() => handleItemSelect(item)}
                                        >
                                            {renderItem(item)}
                                            {isItemSelected(item) && (
                                                <i className="fas fa-check selected-indicator"></i>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectRelation;
