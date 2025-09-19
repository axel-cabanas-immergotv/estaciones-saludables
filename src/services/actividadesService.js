/**
 * Actividades Service - API Layer
 * Handles all CRUD operations for Actividades entity
 * Follows standardized service interface
 */
class ActividadesService {
    constructor() {
        this.baseUrl = '/api/admin/actividades';
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
            console.error('Actividades API Error:', error);
            throw error;
        }
    }

    /**
     * Get actividades with pagination and filters
     */
    async get(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `?${queryString}` : '';
            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('ActividadesService.get error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch actividades' 
            };
        }
    }

    /**
     * Get single actividad by ID
     */
    async getById(id) {
        try {
            return await this.makeRequest(`/${id}`);
        } catch (error) {
            console.error('ActividadesService.getById error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch actividad' 
            };
        }
    }

    /**
     * Create new actividad
     */
    async create(data) {
        try {
            return await this.makeRequest('', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('ActividadesService.create error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to create actividad' 
            };
        }
    }

    /**
     * Update actividad
     */
    async update(id, data) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('ActividadesService.update error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to update actividad' 
            };
        }
    }

    /**
     * Delete actividad
     */
    async delete(id) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('ActividadesService.delete error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to delete actividad' 
            };
        }
    }

    /**
     * Get asistentes for a specific actividad
     */
    async getAsistentes(actividadId) {
        try {
            return await this.makeRequest(`/${actividadId}/asistentes`);
        } catch (error) {
            console.error('ActividadesService.getAsistentes error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch asistentes' 
            };
        }
    }

    /**
     * Format actividad data for display in table
     */
    formatActividadForDisplay(actividad) {
        return {
            ...actividad,
            estacion_nombre: actividad.estacion?.nombre || 'Sin estación',
            full_schedule: `${actividad.profesor} - ${actividad.horario}`,
            status_display: actividad.status === 'active' ? 'Activa' : 'Inactiva',
            asistentes_count: actividad.asistentes?.length || 0
        };
    }

    /**
     * Get actividades as options for select components
     */
    async getActividadOptions() {
        try {
            const response = await this.get({ limit: 1000 }); // Get all actividades
            if (response.success) {
                return response.data.map(actividad => ({
                    value: actividad.id,
                    label: `${actividad.nombre} - ${actividad.estacion?.nombre || 'Sin estación'}`
                }));
            }
            return [];
        } catch (error) {
            console.error('ActividadesService.getActividadOptions error:', error);
            return [];
        }
    }

    /**
     * Validate actividad data
     */
    validateActividadData(data) {
        const errors = {};

        if (!data.nombre || data.nombre.trim().length === 0) {
            errors.nombre = 'El nombre es requerido';
        }

        if (!data.profesor || data.profesor.trim().length === 0) {
            errors.profesor = 'El profesor es requerido';
        }

        if (!data.horario || data.horario.trim().length === 0) {
            errors.horario = 'El horario es requerido';
        }

        if (!data.estacion_id || isNaN(parseInt(data.estacion_id))) {
            errors.estacion_id = 'Debe seleccionar una estación válida';
        }

        return errors;
    }
}

export default new ActividadesService();
