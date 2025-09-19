/**
 * Estaciones Service - API Layer
 * Handles all CRUD operations for Estaciones entity
 * Follows standardized service interface
 */
class EstacionesService {
    constructor() {
        this.baseUrl = '/api/admin/estaciones';
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
            console.error('Estaciones API Error:', error);
            throw error;
        }
    }

    /**
     * Get estaciones with pagination and filters
     */
    async get(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `?${queryString}` : '';
            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('EstacionesService.get error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch estaciones' 
            };
        }
    }

    /**
     * Get single estacion by ID
     */
    async getById(id) {
        try {
            return await this.makeRequest(`/${id}`);
        } catch (error) {
            console.error('EstacionesService.getById error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch estacion' 
            };
        }
    }

    /**
     * Create new estacion
     */
    async create(data) {
        try {
            return await this.makeRequest('', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('EstacionesService.create error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to create estacion' 
            };
        }
    }

    /**
     * Update estacion
     */
    async update(id, data) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('EstacionesService.update error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to update estacion' 
            };
        }
    }

    /**
     * Delete estacion
     */
    async delete(id) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('EstacionesService.delete error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to delete estacion' 
            };
        }
    }

    /**
     * Get actividades for a specific estacion
     */
    async getActividades(estacionId) {
        try {
            return await this.makeRequest(`/${estacionId}/actividades`);
        } catch (error) {
            console.error('EstacionesService.getActividades error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch actividades' 
            };
        }
    }

    /**
     * Format estacion data for display in table
     */
    formatEstacionForDisplay(estacion) {
        return {
            ...estacion,
            full_address: `${estacion.direccion}`,
            coordinates: `${estacion.lat}, ${estacion.lon}`,
            status_display: estacion.status === 'active' ? 'Activa' : 'Inactiva',
            actividades_count: estacion.actividades?.length || 0
        };
    }

    /**
     * Get estaciones as options for select components
     */
    async getEstacionOptions() {
        try {
            const response = await this.get({ limit: 1000 }); // Get all estaciones
            if (response.success) {
                return response.data.map(estacion => ({
                    value: estacion.id,
                    label: estacion.nombre
                }));
            }
            return [];
        } catch (error) {
            console.error('EstacionesService.getEstacionOptions error:', error);
            return [];
        }
    }

    /**
     * Validate estacion data
     */
    validateEstacionData(data) {
        const errors = {};

        if (!data.nombre || data.nombre.trim().length === 0) {
            errors.nombre = 'El nombre es requerido';
        }

        if (!data.direccion || data.direccion.trim().length === 0) {
            errors.direccion = 'La dirección es requerida';
        }

        if (!data.lat || isNaN(parseFloat(data.lat))) {
            errors.lat = 'La latitud debe ser un número válido';
        } else {
            const lat = parseFloat(data.lat);
            if (lat < -90 || lat > 90) {
                errors.lat = 'La latitud debe estar entre -90 y 90';
            }
        }

        if (!data.lon || isNaN(parseFloat(data.lon))) {
            errors.lon = 'La longitud debe ser un número válido';
        } else {
            const lon = parseFloat(data.lon);
            if (lon < -180 || lon > 180) {
                errors.lon = 'La longitud debe estar entre -180 y 180';
            }
        }

        return errors;
    }
}

export default new EstacionesService();
