import { getCurrentAffiliateId } from '../utils/affiliateUtils';

/**
 * Menus Service - API Layer
 * Handles all CRUD operations for Menus entity
 * Includes hierarchical menu management and drag & drop support
 * Follows standardized service interface
 */
class MenusService {
    constructor() {
        this.baseUrl = '/api/admin/menus';
    }

    // Get current affiliate ID from localStorage
    getCurrentAffiliateId() {
        return localStorage.getItem('currentAffiliateId');
    }

    // ============================================================================
    // REQUIRED METHODS (STANDARD INTERFACE)
    // ============================================================================

    /**
     * Helper method to make API requests with proper error handling
     * @param {string} endpoint - API endpoint 
     * @param {object} options - Request options
     * @returns {Promise<object>} API response
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies for JWT
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Menus API Error:', error);
            throw error;
        }
    }

    /**
     * Get menus list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Menus list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Menus-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.platform) queryParams.append('platform', params.platform);

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single menu by ID
     * @param {number} id - Menu ID
     * @returns {Promise<object>} Menu data with full hierarchy
     */
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`);
    }

    /**
     * Create new menu
     * @param {object} data - Menu data
     * @returns {Promise<object>} Created menu
     */
    async create(data) {
        // Validate menu structure
        const validationErrors = this.validateMenuData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Process menu items hierarchy
        if (data.links) {
            data.links = this.processMenuItems(data.links);
        }

        // Add affiliate_id to menu data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }

        return await this.makeRequest('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update existing menu
     * @param {number} id - Menu ID
     * @param {object} data - Updated menu data
     * @returns {Promise<object>} Updated menu
     */
    async update(id, data) {
        // Validate menu structure
        const validationErrors = this.validateMenuData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Process menu items hierarchy
        if (data.links) {
            data.links = this.processMenuItems(data.links);
        }

        // Add affiliate_id to menu data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete menu
     * @param {number} id - Menu ID
     * @returns {Promise<object>} Delete confirmation
     */
    async delete(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // MENU HIERARCHY METHODS
    // ============================================================================

    /**
     * Validate menu data before submission
     * @param {object} data - Menu data to validate
     * @returns {object} Validation errors (empty if valid)
     */
    validateMenuData(data) {
        const errors = {};

        // Required fields
        if (!data.title || data.title.trim() === '') {
            errors.title = 'Menu title is required';
        }

        // Validate platform
        const validPlatforms = ['Web', 'Mobile', 'Both'];
        if (data.platform && !validPlatforms.includes(data.platform)) {
            errors.platform = 'Platform must be Web, Mobile, or Both';
        }

        // Validate status
        if (data.status && !['active', 'inactive'].includes(data.status)) {
            errors.status = 'Status must be either active or inactive';
        }

        // Validate sort_order
        if (data.sort_order !== undefined && data.sort_order !== null) {
            const sortOrder = parseInt(data.sort_order);
            if (isNaN(sortOrder) || sortOrder < 0) {
                errors.sort_order = 'Sort order must be a positive number';
            } else {
                data.sort_order = sortOrder; // Ensure it's a number
            }
        } else {
            data.sort_order = 0; // Default value
        }

        // Validate menu items if present
        if (data.links && Array.isArray(data.links)) {
            const linkErrors = this.validateMenuItems(data.links);
            if (linkErrors.length > 0) {
                errors.links = linkErrors.join(', ');
            }
        }

        return errors;
    }

    /**
     * Validate menu items recursively
     * @param {array} items - Menu items to validate
     * @param {number} level - Current nesting level (0-2)
     * @returns {array} Array of validation errors
     */
    validateMenuItems(items, level = 0) {
        const errors = [];
        const maxLevel = 2; // 0, 1, 2 = 3 levels total

        if (level > maxLevel) {
            errors.push(`Menu items can only be nested ${maxLevel + 1} levels deep`);
            return errors;
        }

        items.forEach((item, index) => {
            // Validate required fields
            if (!item.title || item.title.trim() === '') {
                errors.push(`Item ${index + 1} at level ${level}: Title is required`);
            }

            if (!item.url || item.url.trim() === '') {
                errors.push(`Item ${index + 1} at level ${level}: URL is required`);
            }

            // Validate URL format
            if (item.url && !this.isValidUrl(item.url)) {
                errors.push(`Item ${index + 1} at level ${level}: Invalid URL format`);
            }

            // Validate target
            if (item.target && !['_self', '_blank'].includes(item.target)) {
                errors.push(`Item ${index + 1} at level ${level}: Target must be _self or _blank`);
            }

            // Recursively validate children
            if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                const childErrors = this.validateMenuItems(item.children, level + 1);
                errors.push(...childErrors);
            }
        });

        return errors;
    }

    /**
     * Validate URL format (allows relative and absolute URLs)
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(url) {
        // Allow relative URLs starting with /
        if (url.startsWith('/')) {
            return true;
        }

        // Allow anchor links
        if (url.startsWith('#')) {
            return true;
        }

        // Validate absolute URLs
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Process menu items to ensure proper structure and IDs
     * @param {array} items - Menu items to process
     * @returns {array} Processed menu items
     */
    processMenuItems(items) {
        return items.map(item => {
            const processedItem = {
                ...item,
                // Ensure required fields have defaults
                title: item.title || '',
                url: item.url || '',
                target: item.target || '_self',
                icon: item.icon || '',
                description: item.description || ''
            };

            // Recursively process children
            if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                processedItem.children = this.processMenuItems(item.children);
            }

            return processedItem;
        });
    }

    /**
     * Get default menu data for new menu creation
     * @returns {object} Default menu object
     */
    getDefaultMenuData() {
        return {
            title: '',
            platform: 'Web',
            status: 'active',
            sort_order: 0,
            links: []
        };
    }

    /**
     * Get default menu item data
     * @returns {object} Default menu item object
     */
    getDefaultMenuItemData() {
        return {
            title: '',
            url: '',
            target: '_self',
            icon: '',
            description: '',
            children: []
        };
    }

    /**
     * Format menu for display in table/lists
     * @param {object} menu - Raw menu data
     * @returns {object} Formatted menu
     */
    formatMenuForDisplay(menu) {
        return {
            ...menu,
            status_badge: menu.status === 'active' ? 
                { text: 'Active', class: 'bg-success' } : 
                { text: 'Inactive', class: 'bg-secondary' },
            items_count: this.countMenuItems(menu.links || []),
            platform_display: menu.platform || 'Web'
        };
    }

    /**
     * Count total menu items (including nested)
     * @param {array} items - Menu items array
     * @returns {number} Total count of items
     */
    countMenuItems(items) {
        if (!Array.isArray(items)) return 0;
        
        let count = items.length;
        items.forEach(item => {
            if (item.children && Array.isArray(item.children)) {
                count += this.countMenuItems(item.children);
            }
        });
        
        return count;
    }

    // ============================================================================
    // DRAG & DROP SUPPORT METHODS
    // ============================================================================

    /**
     * Reorder menu items after drag & drop operation
     * @param {number} menuId - Menu ID
     * @param {array} newStructure - New menu structure after drag & drop
     * @returns {Promise<object>} Updated menu
     */
    async reorderItems(menuId, newStructure) {
        try {
            return await this.makeRequest(`/${menuId}/reorder`, {
                method: 'PUT',
                body: JSON.stringify({ links: newStructure })
            });
        } catch (error) {
            console.error('Error reordering menu items:', error);
            throw error;
        }
    }

    /**
     * Add new menu item at specific position
     * @param {number} menuId - Menu ID
     * @param {object} itemData - Menu item data
     * @param {string} position - Position info (e.g., "0", "0.1", "0.1.0")
     * @returns {Promise<object>} Updated menu
     */
    async addMenuItem(menuId, itemData, position = null) {
        try {
            const data = {
                item: this.processMenuItems([itemData])[0],
                position: position
            };

            return await this.makeRequest(`/${menuId}/items`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error adding menu item:', error);
            throw error;
        }
    }

    /**
     * Update menu item
     * @param {number} menuId - Menu ID
     * @param {string} itemId - Item ID or position
     * @param {object} itemData - Updated item data
     * @returns {Promise<object>} Updated menu
     */
    async updateMenuItem(menuId, itemId, itemData) {
        try {
            const data = this.processMenuItems([itemData])[0];

            return await this.makeRequest(`/${menuId}/items/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error updating menu item:', error);
            throw error;
        }
    }

    /**
     * Remove menu item
     * @param {number} menuId - Menu ID
     * @param {string} itemId - Item ID or position
     * @returns {Promise<object>} Updated menu
     */
    async removeMenuItem(menuId, itemId) {
        try {
            return await this.makeRequest(`/${menuId}/items/${itemId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing menu item:', error);
            throw error;
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Find menu item by ID in hierarchical structure
     * @param {array} items - Menu items to search
     * @param {string} targetId - ID to find
     * @returns {object|null} Found item or null
     */
    findMenuItem(items, targetId) {
        for (const item of items) {
            if (item.id === targetId) {
                return item;
            }
            
            if (item.children && Array.isArray(item.children)) {
                const found = this.findMenuItem(item.children, targetId);
                if (found) return found;
            }
        }
        
        return null;
    }

    /**
     * Generate unique temporary ID for new items
     * @returns {string} Temporary ID
     */
    generateTempId() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Convert flat structure to hierarchical (if needed for API compatibility)
     * @param {array} flatItems - Flat array of items with parent references
     * @returns {array} Hierarchical structure
     */
    convertToHierarchy(flatItems) {
        const itemMap = new Map();
        const rootItems = [];

        // First pass: create map of all items
        flatItems.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build hierarchy
        flatItems.forEach(item => {
            const itemObj = itemMap.get(item.id);
            
            if (item.parent_id && itemMap.has(item.parent_id)) {
                itemMap.get(item.parent_id).children.push(itemObj);
            } else {
                rootItems.push(itemObj);
            }
        });

        return rootItems;
    }

    /**
     * Convert hierarchical structure to flat (if needed for API compatibility)
     * @param {array} hierarchicalItems - Hierarchical structure
     * @returns {array} Flat array with parent references
     */
    convertToFlat(hierarchicalItems) {
        const flatItems = [];

        const traverse = (items, parentId = null) => {
            items.forEach((item, index) => {
                const flatItem = {
                    ...item,
                    parent_id: parentId,
                    sort_order: index
                };

                // Remove children from flat item
                const { children, ...itemWithoutChildren } = flatItem;
                flatItems.push(itemWithoutChildren);

                // Recursively process children
                if (children && Array.isArray(children) && children.length > 0) {
                    traverse(children, item.id);
                }
            });
        };

        traverse(hierarchicalItems);
        return flatItems;
    }
}

export default new MenusService(); 