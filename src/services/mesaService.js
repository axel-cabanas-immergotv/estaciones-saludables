import { getCurrentAffiliateId } from '../utils/affiliateUtils';

/**
 * Mesa Service - API Layer
 * Handles all CRUD operations for Mesa entity
 * Follows standardized service interface
 */
class MesaService {
    constructor() {
        this.baseUrl = '/api/admin/mesas';
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
            console.error('Mesa API Error:', error);
            throw error;
        }
    }

    /**
     * Get mesa list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Mesa list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Mesa-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.parent_id) queryParams.append('parent_id', params.parent_id);
        if (params.has_children !== undefined) queryParams.append('has_children', params.has_children);

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single mesa by ID
     * @param {number} id - Mesa ID
     * @returns {Promise<object>} Mesa data
     */
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`);
    }

    /**
     * Create new mesa
     * @param {object} data - Mesa data
     * @returns {Promise<object>} Created mesa
     */
    async create(data) {
        // Auto-generate slug if not provided
        if (!data.slug && data.name) {
            data.slug = this.generateSlug(data.name);
        }

        // Add affiliate_id to mesa data
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
     * Update existing mesa
     * @param {number} id - Mesa ID
     * @param {object} data - Updated mesa data
     * @returns {Promise<object>} Updated category
     */
    async update(id, data) {
        // Add affiliate_id to category data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }
        // Auto-generate slug if not provided
        // if (!data.slug && data.name) {
        //     data.slug = this.generateSlug(data.name);
        // }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete mesa
     * @param {number} id - Mesa ID
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
    // UTILITY METHODS (CATEGORY-SPECIFIC)
    // ============================================================================

    /**
     * Generate URL-friendly slug from title
     * @param {string} title - Mesa name
     * @returns {string} Generated slug
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    /**
     * Validate mesa data before submission
     * @param {object} data - Mesa data to validate
     * @returns {object} Validation errors (empty if valid)
     */
    validateCategoryData(data) {
        const errors = {};

        // Required fields
        if (!data.name || data.name.trim() === '') {
            errors.name = 'Category name is required';
        }

        // Validate status
        if (data.status && !['active', 'inactive'].includes(data.status)) {
            errors.status = 'Status must be either active or inactive';
        }

        // Validate color format
        if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
            errors.color = 'Color must be a valid hex color code';
        }

        // Validate parent_id (can't be self)
        if (data.id && data.parent_id && data.id === data.parent_id) {
            errors.parent_id = 'Category cannot be its own parent';
        }

        return errors;
    }

    /**
     * Get default mesa data for new mesa creation
     * @returns {object} Default mesa object
     */
    getDefaultCategoryData() {
        return {
            name: '',
            slug: '',
            description: '',
            parent_id: null,
            color: '#007cba',
            icon: '',
            status: 'active'
        };
    }

    /**
     * Format mesa for display in table/lists
     * @param {object} mesa - Raw mesa data
     * @returns {object} Formatted mesa
     */
    formatCategoryForDisplay(category) {
        return {
            ...category,
            formatted_name: category.parent_name ? 
                `${category.parent_name} → ${category.name}` : 
                category.name,
            status_badge: category.status === 'active' ? 
                { text: 'Active', class: 'bg-success' } : 
                { text: 'Inactive', class: 'bg-secondary' }
        };
    }

    /**
     * Get mesa formatted for parent selection dropdown
     * @param {number} excludeId - Mesa ID to exclude (prevent self-parent)
     * @returns {Promise<array>} Categories for parent selection
     */
    async getParentOptions(excludeId = null) {
        try {
            const response = await this.get({ status: 'active' });
            if (response.success) {
                return response.data
                    .filter(category => category.id !== excludeId)
                    .map(category => ({
                        value: category.id,
                        label: category.parent_name ? 
                            `${category.parent_name} → ${category.name}` : 
                            category.name
                    }));
            }
            return [];
        } catch (error) {
            console.error('Error loading parent options:', error);
            return [];
        }
    }

    /**
     * Check if mesa has children (for delete prevention)
     * @param {number} id - Mesa ID
     * @returns {Promise<boolean>} True if has children
     */
    async hasChildren(id) {
        try {
            const response = await this.get({ parent_id: id, limit: 1 });
            return response.success && response.data.length > 0;
        } catch (error) {
            console.error('Error checking mesa children:', error);
            return false;
        }
    }
}

export default new MesaService(); 