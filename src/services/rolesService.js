/**
 * Roles Service - API Layer
 * Handles all CRUD operations for Roles entity
 * Follows standardized service interface
 */
class RolesService {
    constructor() {
        this.baseUrl = '/api/admin/roles';
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
            console.error('Roles API Error:', error);
            throw error;
        }
    }

    /**
     * Get roles list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Roles list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Roles-specific filters
        if (params.status) queryParams.append('status', params.status);
        if (params.is_system) queryParams.append('is_system', params.is_system);

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single role by ID
     * @param {number} id - Role ID
     * @returns {Promise<object>} Role data
     */
    async getById(id) {
        return await this.makeRequest(`/${id}`);
    }

    /**
     * Create new role
     * @param {object} data - Role data
     * @returns {Promise<object>} Created role
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validateRoleData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update existing role
     * @param {number} id - Role ID
     * @param {object} data - Updated role data
     * @returns {Promise<object>} Updated role
     */
    async update(id, data) {
        // Validate required fields
        const validationErrors = this.validateRoleData(data, true);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete role
     * @param {number} id - Role ID
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
     * Validate role data
     * @param {object} data - Role data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {object} Validation errors
     */
    validateRoleData(data, isUpdate = false) {
        const errors = {};

        if (!isUpdate && (!data.name || !data.name.trim())) {
            errors.name = 'Role name is required';
        }

        if (!data.display_name || !data.display_name.trim()) {
            errors.display_name = 'Display name is required';
        }

        return errors;
    }

    /**
     * Get default role data structure
     * @returns {object} Default role data
     */
    getDefaultRoleData() {
        return {
            name: '',
            display_name: '',
            description: '',
            permissions: [],
            is_system: false
        };
    }

    /**
     * Format role for display
     * @param {object} role - Role object
     * @returns {object} Formatted role
     */
    formatRoleForDisplay(role) {
        return {
            ...role,
            display_name: role.display_name || role.name,
            permissions_count: role.permissions ? role.permissions.length : 0
        };
    }

    /**
     * Get all permissions for role assignment
     * @returns {Promise<Array>} Permissions list
     */
    async getPermissions() {
        try {
            const response = await fetch('/api/admin/permissions', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching permissions:', error);
            return [];
        }
    }

    /**
     * Get permission options for select
     * @returns {Promise<Array>} Permission options
     */
    async getPermissionOptions() {
        const permissions = await this.getPermissions();
        return permissions.map(permission => ({
            value: permission.id,
            label: `${permission.display_name} (${permission.entity_type}.${permission.action_type})`
        }));
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
}

export default new RolesService(); 