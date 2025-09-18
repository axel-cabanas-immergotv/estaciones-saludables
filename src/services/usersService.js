import { getCurrentAffiliateId } from '../utils/affiliateUtils';

/**
 * Users Service - API Layer
 * Handles all CRUD operations for Users entity
 * Follows standardized service interface
 */
class UsersService {
    constructor() {
        this.baseUrl = '/api/admin/users';
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
                
                // Handle specific HTTP status codes
                if (response.status === 409) {
                    // Conflict - usually duplicate data
                    throw new Error(errorData.message || errorData.error || 'Los datos ingresados ya existen en el sistema');
                } else if (response.status === 400) {
                    // Bad Request - validation errors
                    throw new Error(errorData.message || errorData.error || 'Datos inválidos o incompletos');
                } else if (response.status === 401) {
                    // Unauthorized
                    throw new Error(errorData.message || 'No tienes permisos para realizar esta acción');
                } else if (response.status === 403) {
                    // Forbidden - use API message if available
                    throw new Error(errorData.message || 'Acceso denegado');
                } else if (response.status === 500) {
                    // Internal Server Error
                    throw new Error(errorData.message || 'Error interno del servidor. Por favor, intenta más tarde.');
                } else {
                    throw new Error(errorData.message || errorData.error || `Error del servidor: ${response.status}`);
                }
            }

            return await response.json();
        } catch (error) {
            console.error('Users API Error:', error);
            throw error;
        }
    }

    /**
     * Get users list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Users list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Users-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.role_id) queryParams.append('role_id', params.role_id);

        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single user by ID
     * @param {number} id - User ID
     * @returns {Promise<object>} User data
     */
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return await this.makeRequest(`/${id}${queryParams}`);
    }

    /**
     * Get available roles that the current user can create
     * @returns {Promise<object>} Available roles for user creation
     */
    async getAvailableRoles() {
        return await this.makeRequest('/available-roles');
    }

    /**
     * Create new user
     * @param {object} data - User data
     * @returns {Promise<object>} Created user
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validateUserData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        // Add affiliate_id to user data
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
     * Update existing user
     * @param {number} id - User ID
     * @param {object} data - Updated user data
     * @returns {Promise<object>} Updated user
     */
    async update(id, data) {
        // Add affiliate_id to user data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }
        // For updates, password is optional
        const validationErrors = this.validateUserData(data, true);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<object>} Delete confirmation
     */
    async delete(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        console.log('🗑️ usersService.delete called with id:', id, 'URL:', `/${id}${queryParams}`);
        return await this.makeRequest(`/${id}${queryParams}`, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // UTILITY METHODS (USER-SPECIFIC)
    // ============================================================================

    /**
     * Validate user data before submission
     * @param {object} data - User data to validate
     * @param {boolean} isUpdate - Whether this is an update (password optional)
     * @returns {object} Validation errors (empty if valid)
     */
    validateUserData(data, isUpdate = false) {
        const errors = {};

        // Required fields
        if (!data.first_name || data.first_name.trim() === '') {
            errors.first_name = 'First name is required';
        }

        if (!data.last_name || data.last_name.trim() === '') {
            errors.last_name = 'Last name is required';
        }


        // DNI validation
        if (!data.dni) {
            errors.dni = 'DNI is required';
        } else if (isNaN(data.dni) || data.dni <= 0) {
            errors.dni = 'DNI must be a valid positive number';
        }

        // Telefono validation
        if (!data.telefono) {
            errors.telefono = 'El numero de telefono es requerido';
        }

        if (!isUpdate && (!data.password || data.password.trim() === '')) {
            errors.password = 'Password is required for new users';
        }

        if (!data.role_id) {
            errors.role_id = 'Role is required';
        }

        // Validate status
        if (data.status && !['active', 'inactive'].includes(data.status)) {
            errors.status = 'Status must be either active or inactive';
        }

        // Password strength validation (if provided)
        if (data.password && data.password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
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
            first_name: '',
            last_name: '',
            dni: '',
            telefono: '',
            email: '',
            password: '',
            role_id: null,
            status: 'active',
            affiliate_ids: []
        };
    }

    /**
     * Format user for display in table/lists
     * @param {object} user - Raw user data
     * @returns {object} Formatted user
     */
    formatUserForDisplay(user) {
        return {
            ...user,
            full_name: `${user.first_name} ${user.last_name}`.trim(),
            status_badge: user.status === 'active' ? 
                { text: 'Active', class: 'bg-success' } : 
                { text: 'Inactive', class: 'bg-secondary' },
            role_display: user.role?.display_name || user.role?.name || 'No Role'
        };
    }



    // ============================================================================
    // RELATED DATA METHODS
    // ============================================================================

    /**
     * Get available roles for user assignment
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
     * Get available affiliates for user assignment
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
     * @param {number} excludeUserId - User ID to exclude from check
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
     * Change user password
     * @param {number} userId - User ID
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
}

export default new UsersService(); 