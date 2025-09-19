/**
 * Ciudadanos Service - API Layer
 * Handles all CRUD operations for Ciudadanos entity
 * Follows standardized service interface
 */
class CiudadanosService {
    constructor() {
        this.baseUrl = '/api/admin/ciudadanos';
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
            console.error('Ciudadanos API Error:', error);
            throw error;
        }
    }

    /**
     * Get ciudadanos with pagination and filters
     */
    async get(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `?${queryString}` : '';
            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('CiudadanosService.get error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch ciudadanos' 
            };
        }
    }

    /**
     * Get single ciudadano by ID
     */
    async getById(id) {
        try {
            return await this.makeRequest(`/${id}`);
        } catch (error) {
            console.error('CiudadanosService.getById error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to fetch ciudadano' 
            };
        }
    }

    /**
     * Create new ciudadano
     */
    async create(data) {
        try {
            return await this.makeRequest('', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('CiudadanosService.create error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to create ciudadano' 
            };
        }
    }

    /**
     * Update ciudadano
     */
    async update(id, data) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('CiudadanosService.update error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to update ciudadano' 
            };
        }
    }

    /**
     * Delete ciudadano
     */
    async delete(id) {
        try {
            return await this.makeRequest(`/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('CiudadanosService.delete error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to delete ciudadano' 
            };
        }
    }

    /**
     * Search ciudadano by DNI
     */
    async searchByDni(dni) {
        try {
            return await this.makeRequest(`/search/dni/${dni}`);
        } catch (error) {
            console.error('CiudadanosService.searchByDni error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to search ciudadano by DNI' 
            };
        }
    }

    /**
     * Format ciudadano data for display in table
     */
    formatCiudadanoForDisplay(ciudadano) {
        return {
            ...ciudadano,
            full_name: `${ciudadano.apellido || ''}, ${ciudadano.nombre || ''}`.trim().replace(/^,\s*/, ''),
            actividades_count: ciudadano.asistentes?.length || 0,
            status_display: ciudadano.status === 'active' ? 'Activo' : 'Inactivo',
            genero_display: ciudadano.genero ? 
                ciudadano.genero.charAt(0).toUpperCase() + ciudadano.genero.slice(1) : 
                'No especificado',
            dni_formatted: ciudadano.dni ? ciudadano.dni.toString() : 'Sin DNI'
        };
    }

    /**
     * Get ciudadanos as options for select components
     */
    async getCiudadanoOptions() {
        try {
            const response = await this.get({ limit: 1000 }); // Get all ciudadanos
            if (response.success) {
                return response.data.map(ciudadano => ({
                    value: ciudadano.id,
                    label: `${ciudadano.apellido}, ${ciudadano.nombre} (DNI: ${ciudadano.dni})`
                }));
            }
            return [];
        } catch (error) {
            console.error('CiudadanosService.getCiudadanoOptions error:', error);
            return [];
        }
    }

    /**
     * Validate ciudadano data
     */
    validateCiudadanoData(data) {
        const errors = {};

        if (!data.nombre || data.nombre.trim().length === 0) {
            errors.nombre = 'El nombre es requerido';
        }

        if (!data.apellido || data.apellido.trim().length === 0) {
            errors.apellido = 'El apellido es requerido';
        }

        if (!data.dni || isNaN(parseInt(data.dni))) {
            errors.dni = 'El DNI debe ser un número válido';
        } else {
            const dni = parseInt(data.dni);
            if (dni < 1000000 || dni > 99999999) {
                errors.dni = 'El DNI debe tener entre 7 y 8 dígitos';
            }
        }

        if (data.genero && !['masculino', 'femenino', 'otro'].includes(data.genero)) {
            errors.genero = 'El género debe ser masculino, femenino u otro';
        }

        return errors;
    }
}

export default new CiudadanosService();
