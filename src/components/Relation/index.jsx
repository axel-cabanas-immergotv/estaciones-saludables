import React, { useState, useEffect } from 'react';
import './relation.css';

/**
 * Relation Component - Reusable component for managing entity relationships
 * 
 * @param {Object} props
 * @param {string} props.entity - Entity type to relate (e.g., 'user', 'category')
 * @param {boolean} props.multiple - Whether multiple selections are allowed
 * @param {string} props.key - Field to display in the dropdown (e.g., 'email', 'name')
 * @param {string} props.value - Field to use as value (e.g., 'id')
 * @param {Array} props.selectedItems - Currently selected items
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.label - Label for the relation field
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether the field is required
 * @param {Function} props.fetchItems - Function to fetch available items
 * @param {string} props.searchPlaceholder - Placeholder for search input
 */
const Relation = ({
    entity,
    multiple = false,
    key: keyField,
    value: valueField,
    selectedItems = [],
    onChange,
    label,
    placeholder,
    required = false,
    fetchItems,
    searchPlaceholder = 'Search...'
}) => {
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);

    // Load available items on component mount
    useEffect(() => {
        loadAvailableItems();
    }, []);

    // Filter items based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredItems(availableItems);
        } else {
            const filtered = availableItems.filter(item => 
                item[keyField]?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [searchTerm, availableItems, keyField]);

    const loadAvailableItems = async () => {
        if (!fetchItems) return;
        
        setLoading(true);
        try {
            const items = await fetchItems();
            setAvailableItems(items);
            setFilteredItems(items);
        } catch (error) {
            console.error(`Error loading ${entity} items:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelect = (item) => {
        if (multiple) {
            // Check if item is already selected
            const isSelected = selectedItems.some(selected => selected[valueField] === item[valueField]);
            
            if (isSelected) {
                // Remove item
                const newSelection = selectedItems.filter(selected => selected[valueField] !== item[valueField]);
                onChange(newSelection);
            } else {
                // Add item
                const newSelection = [...selectedItems, item];
                onChange(newSelection);
            }
        } else {
            // Single selection
            onChange([item]);
            setShowDropdown(false);
        }
        
        setSearchTerm('');
    };

    const handleItemRemove = (itemToRemove) => {
        const newSelection = selectedItems.filter(item => item[valueField] !== itemToRemove[valueField]);
        onChange(newSelection);
    };

    const getSelectedDisplay = () => {
        if (selectedItems.length === 0) {
            return placeholder || `Select ${entity}...`;
        }
        
        if (multiple) {
            if (selectedItems.length === 1) {
                return selectedItems[0][keyField];
            }
            return `${selectedItems.length} ${entity} selected`;
        }
        
        return selectedItems[0][keyField];
    };

    const isItemSelected = (item) => {
        return selectedItems.some(selected => selected[valueField] === item[valueField]);
    };

    return (
        <div className="relation-component">
            <label className="form-label">
                {label || `${entity.charAt(0).toUpperCase() + entity.slice(1)}s`}
                {required && <span className="text-danger">*</span>}
            </label>
            
            <div className="relation-container">
                {/* Selected Items Display */}
                <div className="selected-items">
                    {selectedItems.map((item, index) => (
                        <span key={`${item[valueField]}-${index}`} className="selected-item">
                            {item[keyField]}
                            <button
                                type="button"
                                className="remove-item"
                                onClick={() => handleItemRemove(item)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>

                {/* Dropdown Trigger */}
                <div className="relation-dropdown-container">
                    <button
                        type="button"
                        className={`relation-trigger ${showDropdown ? 'active' : ''}`}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <span className="trigger-text">
                            {getSelectedDisplay()}
                        </span>
                        <i className="fas fa-chevron-down"></i>
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="relation-dropdown">
                            {/* Search Input */}
                            <div className="search-container">
                                <input
                                    type="text"
                                    className="form-control search-input"
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Items List */}
                            <div className="items-list">
                                {loading ? (
                                    <div className="loading-item">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Loading...
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="no-items">
                                        No {entity} found
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <button
                                            key={`${item[valueField]}-${index}`}
                                            type="button"
                                            className={`dropdown-item ${isItemSelected(item) ? 'selected' : ''}`}
                                            onClick={() => handleItemSelect(item)}
                                        >
                                            {item[keyField]}
                                            {isItemSelected(item) && (
                                                <i className="fas fa-check ms-2"></i>
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

export default Relation; 