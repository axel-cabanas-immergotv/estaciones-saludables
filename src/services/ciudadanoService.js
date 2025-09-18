import { getCurrentAffiliateId } from '../utils/affiliateUtils';

/**
 * Ciudadano Service - API Layer
 * Handles all CRUD operations for Ciudadano entity
 * Follows standardized service interface
 */
class CiudadanoService {
    constructor() {
        this.baseUrl = '/api/admin/ciudadanos';
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
            console.error('Ciudadano API Error:', error);
            throw error;
        }
    }

    /**
     * Get ciudadanos list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Ciudadanos list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Ciudadanos-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.role_id) queryParams.append('role_id', params.role_id);

        // Process dynamic filters from params.filters
        if (params.filters && typeof params.filters === 'object') {
            Object.entries(params.filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single ciudadano by ID
     * @param {number} id - Ciudadano ID
     * @returns {Promise<object>} Ciudadano data
     */
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`);
    }

    /**
     * Get available roles that the current ciudadano can create
     * @returns {Promise<object>} Available roles for ciudadano creation
     */
    async getAvailableRoles() {
        return await this.makeRequest('/available-roles');
    }

    /**
     * Create new ciudadano
     * @param {object} data - Ciudadano data
     * @returns {Promise<object>} Created ciudadano
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validateUserData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Add affiliate_id to ciudadano data
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
     * Update existing ciudadano
     * @param {number} id - Ciudadano ID
     * @param {object} data - Updated ciudadano data
     * @returns {Promise<object>} Updated ciudadano
     */
    async update(id, data) {
        // Add affiliate_id to ciudadano data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }
        // For updates, password is optional
        const validationErrors = this.validateUserData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete ciudadano
     * @param {number} id - Ciudadano ID
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
    // UTILITY METHODS (CIUDADANO-SPECIFIC)
    // ============================================================================

    /**
     * Validate user data before submission
     * @param {object} data - Ciudadano data to validate
     * @param {boolean} isUpdate - Whether this is an update (password optional)
     * @returns {object} Validation errors (empty if valid)
     */
    validateUserData(data) {
        const errors = {};

        // Required fields
        if (!data.nombre || data.nombre.trim() === '') {
            errors.nombre = 'First name is required';
        }

        if (!data.apellido || data.apellido.trim() === '') {
            errors.apellido = 'Last name is required';
        }

        // DNI validation
        if (!data.dni) {
            errors.dni = 'DNI is required';
        } else if (isNaN(data.dni) || data.dni <= 0) {
            errors.dni = 'DNI must be a valid positive number';
        }

        // Validate status
        if (data.status && !['active', 'inactive'].includes(data.status)) {
            errors.status = 'Status must be either active or inactive';
        }

        return errors;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get default user data for new user creation
     * @returns {object} Default user object
     */
    getDefaultUserData() {
        return {
            nombre: '',
            apellido: '',
            dni: '',
            domicilio: '',
            codigo_postal: '',
            numero_orden: '',
            voto: false,
            status: 'active',
        };
    }

    /**
     * Format ciudadano for display in table/lists
     * @param {object} user - Raw ciudadano data
     * @returns {object} Formatted ciudadano
     */
    formatUserForDisplay(user) {
        return {
            ...user,
            full_name: `${user.nombre} ${user.apellido}`.trim(),
            status_badge: user.status === 'active' ? 
                { text: 'Active', class: 'bg-success' } : 
                { text: 'Inactive', class: 'bg-secondary' },
        };
    }

    /**
     * Generate username from email if not provided
     * @param {string} email - Ciudadano's email
     * @returns {string} Generated username
     */
    generateUsername(email) {
        if (!email) return '';
        return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // ============================================================================
    // RELATED DATA METHODS
    // ============================================================================

    /**
     * Get available roles for ciudadano assignment
     * @returns {Promise<array>} Available roles
     */
    async getRoles() {
        try {
            const response = await fetch('/api/admin/roles', {
                credentials: 'include'
            });
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error loading roles:', error);
            return [];
        }
    }

    /**
     * Get available affiliates for ciudadano assignment
     * @returns {Promise<array>} Available affiliates
     */
    async getAffiliates() {
        try {
            const response = await fetch('/api/admin/affiliates', {
                credentials: 'include'
            });
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error loading affiliates:', error);
            return [];
        }
    }

    /**
     * Get roles formatted for select dropdown
     * @returns {Promise<array>} Roles for dropdown
     */
    async getRoleOptions() {
        try {
            const roles = await this.getRoles();
            return roles.map(role => ({
                value: role.id,
                label: role.display_name || role.name
            }));
        } catch (error) {
            console.error('Error loading role options:', error);
            return [];
        }
    }

    /**
     * Get affiliates formatted for select dropdown
     * @returns {Promise<array>} Affiliates for dropdown
     */
    async getAffiliateOptions() {
        try {
            const affiliates = await this.getAffiliates();
            return affiliates.map(affiliate => ({
                value: affiliate.id,
                label: affiliate.name
            }));
        } catch (error) {
            console.error('Error loading affiliate options:', error);
            return [];
        }
    }

    /**
     * Check if email is already taken
     * @param {string} email - Email to check
     * @param {number} excludeUserId - Ciudadano ID to exclude from check
     * @returns {Promise<boolean>} True if email is available
     */
    async isEmailAvailable(email, excludeUserId = null) {
        try {
            const params = new URLSearchParams();
            params.append('email', email);
            if (excludeUserId) params.append('exclude_id', excludeUserId);

            const response = await this.makeRequest(`/check-email?${params.toString()}`);
            return response.available;
        } catch (error) {
            console.error('Error checking email availability:', error);
            return false;
        }
    }

    /**
     * Change ciudadano password
     * @param {number} userId - Ciudadano ID
     * @param {string} newPassword - New password
     * @returns {Promise<object>} Result
     */
    async changePassword(userId, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        return await this.makeRequest(`/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password: newPassword })
        });
    }

    /**
     * Get vote counts for ciudadanos (total counts, not paginated)
     * @param {object} filters - Filters to apply (same as get method)
     * @returns {Promise<object>} Vote counts
     */
    async getVoteCounts(filters = {}) {
        const queryParams = new URLSearchParams();
        
        // Process dynamic filters from filters object
        if (filters && typeof filters === 'object') {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = `/vote-counts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await this.makeRequest(endpoint);
    }
}

export default new CiudadanoService(); 