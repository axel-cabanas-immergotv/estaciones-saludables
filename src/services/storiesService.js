import { getCurrentAffiliateId } from '../utils/affiliateUtils';

/**
 * Stories Service - API Layer
 * Handles all CRUD operations for Stories entity
 * Follows standardized service interface
 */
class StoriesService {
    constructor() {
        this.baseUrl = '/api/admin/stories';
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
            console.error('Stories API Error:', error);
            throw error;
        }
    }

    /**
     * Get stories list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Stories list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Stories-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.category_id) queryParams.append('category_id', params.category_id);

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single story by ID
     * @param {number} id - Story ID
     * @returns {Promise<object>} Story data
     */
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`);
    }

    /**
     * Create new story
     * @param {object} data - Story data
     * @returns {Promise<object>} Created story
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validateStoryData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Add affiliate_id to story data
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
     * Update existing story
     * @param {number} id - Story ID
     * @param {object} data - Updated story data
     * @returns {Promise<object>} Updated story
     */
    async update(id, data) {
        // Validate required fields
        const validationErrors = this.validateStoryData(data, true);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Add affiliate_id to story data
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
     * Delete story
     * @param {number} id - Story ID
     * @returns {Promise<object>} Deletion result
     */
    async delete(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Validate story data
     * @param {object} data - Story data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {object} Validation errors
     */
    validateStoryData(data, isUpdate = false) {
        const errors = {};

        if (!data.title || !data.title.trim()) {
            errors.title = 'Story title is required';
        }

        if (!data.content || !data.content.trim()) {
            errors.content = 'Story content is required';
        }

        // category_id is optional, so we don't validate it

        return errors;
    }

    /**
     * Get default story data structure
     * @returns {object} Default story data
     */
    getDefaultStoryData() {
        return {
            title: '',
            subtitle: '',
            content: '',
            featured_image: '',
            category_id: '',
            status: 'draft',
            meta_description: '',
            meta_keywords: '',
            slug: ''
        };
    }

    /**
     * Format story for display
     * @param {object} story - Story object
     * @returns {object} Formatted story
     */
    formatStoryForDisplay(story) {
        return {
            ...story,
            title_display: story.title || 'Untitled Story',
            category_name: story.category ? story.category.name : 'Uncategorized',
            author_name: story.author ? `${story.author.first_name} ${story.author.last_name}` : 'Unknown'
        };
    }

    /**
     * Generate slug from title
     * @param {string} title - Story title
     * @returns {string} Generated slug
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    /**
     * Get categories for story assignment
     * @returns {Promise<Array>} Categories list
     */
    async getCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    /**
     * Get category options for select
     * @returns {Promise<Array>} Category options
     */
    async getCategoryOptions() {
        const categories = await this.getCategories();
        return categories.map(category => ({
            value: category.id,
            label: category.name
        }));
    }

    /**
     * Get status options for select
     * @returns {Array} Status options
     */
    getStatusOptions() {
        return [
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' }
        ];
    }

    /**
     * Upload featured image
     * @param {File} file - Image file
     * @returns {Promise<object>} Upload result
     */
    async uploadFeaturedImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'story_featured');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : null;
            }

            throw new Error('Upload failed');
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}

export default new StoriesService(); 