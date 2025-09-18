/**
 * Affiliates Service - API Layer
 * Handles all CRUD operations for Affiliates entity
 * Follows standardized service interface
 */
class AffiliatesService {
    constructor() {
        this.baseUrl = '/api/admin/affiliates';
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
            console.error('Affiliates API Error:', error);
            throw error;
        }
    }

    /**
     * Get affiliates list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Affiliates list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Affiliates-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.type) queryParams.append('type', params.type);

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single affiliate by ID
     * @param {number} id - Affiliate ID
     * @returns {Promise<object>} Affiliate data
     */
    async getById(id) {
        return await this.makeRequest(`/${id}`);
    }

    /**
     * Create new affiliate
     * @param {object} data - Affiliate data
     * @returns {Promise<object>} Created affiliate
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validateAffiliateData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update existing affiliate
     * @param {number} id - Affiliate ID
     * @param {object} data - Updated affiliate data
     * @returns {Promise<object>} Updated affiliate
     */
    async update(id, data) {
        // Validate required fields
        const validationErrors = this.validateAffiliateData(data, true);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete affiliate
     * @param {number} id - Affiliate ID
     * @returns {Promise<object>} Deletion result
     */
    async delete(id) {
        return await this.makeRequest(`/${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Validate affiliate data
     * @param {object} data - Affiliate data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {object} Validation errors
     */
    validateAffiliateData(data, isUpdate = false) {
        const errors = {};

        if (!data.name || !data.name.trim()) {
            errors.name = 'Affiliate name is required';
        }

        if (!data.slug || !data.slug.trim()) {
            errors.slug = 'Slug is required';
        }

        if (data.contact_email && !this.isValidEmail(data.contact_email)) {
            errors.contact_email = 'Invalid email format';
        }

        return errors;
    }

    /**
     * Get default affiliate data structure
     * @returns {object} Default affiliate data
     */
    getDefaultAffiliateData() {
        return {
            name: '',
            slug: '',
            description: '',
            contact_email: '',
            contact_phone: '',
            website_url: '',
            status: 'active',
            type: 'organization'
        };
    }

    /**
     * Format affiliate for display
     * @param {object} affiliate - Affiliate object
     * @returns {object} Formatted affiliate
     */
    formatAffiliateForDisplay(affiliate) {
        return {
            ...affiliate,
            name_display: affiliate.name || 'Unnamed Affiliate',
            type_display: this.getTypeDisplay(affiliate.type)
        };
    }

    /**
     * Format user for display
     * @param {object} user - User object
     * @returns {object} Formatted user
     */
    formatUserForDisplay(user) {
        return {
            ...user,
            name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
            name_display: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email
        };
    }

    /**
     * Generate slug from name
     * @param {string} name - Affiliate name
     * @returns {string} Generated slug
     */
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    /**
     * Get type display name
     * @param {string} type - Affiliate type
     * @returns {string} Display name
     */
    getTypeDisplay(type) {
        const types = {
            'organization': 'Organization',
            'individual': 'Individual',
            'partner': 'Partner',
            'sponsor': 'Sponsor'
        };
        return types[type] || type;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get type options for select
     * @returns {Array} Type options
     */
    getTypeOptions() {
        return [
            { value: 'organization', label: 'Organization' },
            { value: 'individual', label: 'Individual' },
            { value: 'partner', label: 'Partner' },
            { value: 'sponsor', label: 'Sponsor' }
        ];
    }

    /**
     * Get status options for select
     * @returns {Array} Status options
     */
    getStatusOptions() {
        return [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
        ];
    }

    // ============================================================================
    // MEMBER MANAGEMENT METHODS
    // ============================================================================

    /**
     * Get affiliate members
     * @param {number} affiliateId - Affiliate ID
     * @returns {Promise<object>} Members list
     */
    async getMembers(affiliateId) {
        return await this.makeRequest(`/${affiliateId}/members`);
    }

    /**
     * Get available affiliates that can be added as members
     * @param {number} affiliateId - Affiliate ID
     * @returns {Promise<object>} Available affiliates
     */
    async getAvailableMembers(affiliateId) {
        return await this.makeRequest(`/${affiliateId}/available-members`);
    }

    /**
     * Add member to affiliate
     * @param {number} affiliateId - Affiliate ID
     * @param {number} toAffiliateId - Member affiliate ID
     * @param {object} permissions - Member permissions
     * @returns {Promise<object>} Add result
     */
    async addMember(affiliateId, toAffiliateId, permissions = {}) {
        return await this.makeRequest(`/${affiliateId}/members`, {
            method: 'POST',
            body: JSON.stringify({
                to_affiliate_id: toAffiliateId,
                permissions: permissions
            })
        });
    }

    /**
     * Update member permissions
     * @param {number} affiliateId - Affiliate ID
     * @param {number} memberId - Member affiliate ID
     * @param {object} permissions - Updated permissions
     * @returns {Promise<object>} Update result
     */
    async updateMemberPermissions(affiliateId, memberId, permissions) {
        return await this.makeRequest(`/${affiliateId}/members/${memberId}`, {
            method: 'PUT',
            body: JSON.stringify({ permissions })
        });
    }

    /**
     * Remove member from affiliate
     * @param {number} affiliateId - Affiliate ID
     * @param {number} memberId - Member affiliate ID
     * @returns {Promise<object>} Remove result
     */
    async removeMember(affiliateId, memberId) {
        return await this.makeRequest(`/${affiliateId}/members/${memberId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get permission options for checkboxes
     * @returns {Array} Permission options
     */
    getPermissionOptions() {
        return [
            { 
                name: 'can_use', 
                label: 'B can use content from A',
                description: 'Allow this affiliate to use content from the current affiliate'
            },
            { 
                name: 'can_copy', 
                label: 'B can copy content from A',
                description: 'Allow this affiliate to copy content from the current affiliate'
            },
            { 
                name: 'can_assign', 
                label: 'B can assign content to A',
                description: 'Allow this affiliate to assign content to the current affiliate'
            },
            { 
                name: 'access_publishers', 
                label: 'Access to A enabled for B\'s publishers',
                description: 'Allow this affiliate\'s publishers to access the current affiliate'
            }
        ];
    }

    /**
     * Get current user info
     * @returns {Promise<object>} Current user data
     */
    async getCurrentUser() {
        try {
            const response = await fetch('/api/admin/affiliates/current-user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : null;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }


}

export default new AffiliatesService(); 