/**
 * Permissions Service - API Layer
 * Handles all CRUD operations for Permissions entity
 * Follows standardized service interface
 */
class PermissionsService {
    constructor() {
        this.baseUrl = '/api/admin/permissions';
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
            console.error('Permissions API Error:', error);
            throw error;
        }
    }

    /**
     * Get permissions list with pagination and filtering
     * @param {object} params - Query parameters
     * @returns {Promise<object>} Permissions list with pagination
     */
    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Standard pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        
        // Permissions-specific filters
        if (params.entity) queryParams.append('entity', params.entity);
        if (params.action) queryParams.append('action', params.action);

        const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get single permission by ID
     * @param {number} id - Permission ID
     * @returns {Promise<object>} Permission data
     */
    async getById(id) {
        return await this.makeRequest(`/${id}`);
    }

    /**
     * Create new permission
     * @param {object} data - Permission data
     * @returns {Promise<object>} Created permission
     */
    async create(data) {
        // Validate required fields
        const validationErrors = this.validatePermissionData(data);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update existing permission
     * @param {number} id - Permission ID
     * @param {object} data - Updated permission data
     * @returns {Promise<object>} Updated permission
     */
    async update(id, data) {
        // Validate required fields
        const validationErrors = this.validatePermissionData(data, true);
        if (Object.keys(validationErrors).length > 0) {
            throw new Error(Object.values(validationErrors)[0]);
        }

        return await this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete permission
     * @param {number} id - Permission ID
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
     * Validate permission data
     * @param {object} data - Permission data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {object} Validation errors
     */
    validatePermissionData(data, isUpdate = false) {
        const errors = {};

        if (!isUpdate && (!data.name || !data.name.trim())) {
            errors.name = 'Permission name is required';
        }

        if (!data.display_name || !data.display_name.trim()) {
            errors.display_name = 'Display name is required';
        }

        if (!data.entity || !data.entity.trim()) {
            errors.entity = 'Entity type is required';
        }

        if (!data.action || !data.action.trim()) {
            errors.action = 'Action type is required';
        }

        return errors;
    }

    /**
     * Get default permission data structure
     * @returns {object} Default permission data
     */
    getDefaultPermissionData() {
        return {
            name: '',
            display_name: '',
            description: '',
            entity: '',
            action: '',
            is_system: false
        };
    }

    /**
     * Format permission for display
     * @param {object} permission - Permission object
     * @returns {object} Formatted permission
     */
    formatPermissionForDisplay(permission) {
        return {
            ...permission,
            display_name: permission.display_name || permission.name,
            entity_type_display: this.getEntityTypeDisplay(permission.entity),
            action_type_display: this.getActionTypeDisplay(permission.action)
        };
    }

    /**
     * Get entity type display name
     * @param {string} entityType - Entity type
     * @returns {string} Display name
     */
    getEntityTypeDisplay(entityType) {
        const entityTypes = {
            'users': 'Users',
            'roles': 'Roles',
            'permissions': 'Permissions',
            'pages': 'Pages',
            'stories': 'Stories',
            'categories': 'Categories',
            'menus': 'Menus',
            'modules': 'Modules',
            'affiliates': 'Affiliates'
        };
        return entityTypes[entityType] || entityType;
    }

    /**
     * Get action type display name
     * @param {string} actionType - Action type
     * @returns {string} Display name
     */
    getActionTypeDisplay(actionType) {
        const actionTypes = {
            'create': 'Create',
            'read': 'Read',
            'update': 'Update',
            'delete': 'Delete',
            'update_own': 'Update Own',
            'delete_own': 'Delete Own'
        };
        return actionTypes[actionType] || actionType;
    }

    /**
     * Get entity type options for select
     * @returns {Array} Entity type options
     */
    getEntityTypeOptions() {
        return [
            { value: 'users', label: 'Usuarios' },
            { value: 'roles', label: 'Roles' },
            { value: 'permissions', label: 'Permisos' },
            { value: 'responsable_localidad', label: 'Responsable de Localidad' },
            { value: 'responsable_circuito', label: 'Responsable de Circuito' },
            { value: 'jefe_de_campana', label: 'Jefe de Campaña' },
            { value: 'logistica', label: 'Logistica' },
            { value: 'fiscal_general', label: 'Fiscal General' },
            { value: 'fiscal_de_mesa', label: 'Fiscal de Mesa' },
            { value: 'localidades', label: 'Localidades' },
            { value: 'secciones', label: 'Secciones' },
            { value: 'circuitos', label: 'Circuitos' },
            { value: 'escuelas', label: 'Escuelas' },
            { value: 'mesas', label: 'Mesas' }
        ];
    }

    /**
     * Get action type options for select
     * @returns {Array} Action type options
     */
    getActionTypeOptions() {
        return [
            { value: 'create', label: 'Crear' },
            { value: 'read', label: 'Ver' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Borrar' },
            { value: 'update_own', label: 'Actualizar Propio' },
            { value: 'delete_own', label: 'Borrar Propio' }
        ];
    }
}

export default new PermissionsService(); 