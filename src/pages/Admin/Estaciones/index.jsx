/**
 * Estaciones Admin Page
 * Handles estaciones management with table view and modal editing
 * Uses DynamicModal for CRUD operations
 */
import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import estacionesService from '../../../services/estacionesService';
import ContentHeader from '../../../components/ContentHeader';

const EstacionesPage = () => {
    // ============================================================================
    // STATE MANAGEMENT (Standard for all entities)
    // ============================================================================
    
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const tableRef = useRef(null);

    // ============================================================================
    // STANDARD API METHODS (Same names across all entities)
    // ============================================================================

    /**
     * Load entities with pagination and filtering
     */
    const load = async (page = 1, limit = 20, search = '', filters = {}) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: search.trim(),
                ...filters
            };

            const response = await estacionesService.get(params);
            
            if (response.success) {
                // Format estaciones for display
                const formattedEstaciones = response.data.map(estacion => 
                    estacionesService.formatEstacionForDisplay(estacion)
                );
                
                setEntities(formattedEstaciones);
                setPagination(response.pagination);
                setCurrentPage(page);
                setPageSize(limit);
                setCurrentSearch(search);
                setCurrentFilters(filters);
            } else {
                console.error('Failed to load estaciones:', response.error);
                setEntities([]);
                setPagination(null);
            }
        } catch (error) {
            console.error('Error loading estaciones:', error);
            setEntities([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load single entity for editing
     */
    const loadForEditing = async (id) => {
        try {
            const response = await estacionesService.getById(id);
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to load estacion');
            }
        } catch (error) {
            console.error('Error loading estacion for editing:', error);
            throw error;
        }
    };

    /**
     * Save entity (create or update)
     */
    const save = async (data, id = null) => {
        try {
            // Validate data
            const validationErrors = estacionesService.validateEstacionData(data);
            if (Object.keys(validationErrors).length > 0) {
                throw new Error('Validation failed: ' + Object.values(validationErrors).join(', '));
            }

            let response;
            if (id) {
                response = await estacionesService.update(id, data);
            } else {
                response = await estacionesService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save estacion');
            }
        } catch (error) {
            console.error('Error saving estacion:', error);
            throw error;
        }
    };

    /**
     * Delete entity
     */
    const deleteEntity = async (id) => {
        try {
            const response = await estacionesService.delete(id);
            if (response.success) {
                // Refresh table after deletion
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return true;
            } else {
                throw new Error(response.error || 'Failed to delete estacion');
            }
        } catch (error) {
            console.error('Error deleting estacion:', error);
            throw error;
        }
    };

    // ============================================================================
    // RELATED DATA LOADING
    // ============================================================================
    // No related data needed for estaciones

    // ============================================================================
    // TABLE CONFIGURATION
    // ============================================================================

    const tableConfig = {
        // Basic configuration
        tableId: 'estaciones-table',
        entityType: 'estacion',
        emptyMessage: 'No hay estaciones registradas. ¡Crea tu primera estación para comenzar!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Estación',
                field: 'nombre',
                type: 'text',
            },
            {
                header: 'Dirección',
                field: 'direccion',
                type: 'text'
            },
            {
                header: 'Coordenadas',
                field: 'coordinates',
                type: 'text'
            },
            {
                header: 'Actividades',
                field: 'actividades_count',
                type: 'text'
            },
            {
                header: 'Estado',
                field: 'status',
                type: 'badge',
                badgeMap: {
                    'active': { text: 'Activa', class: 'bg-success' },
                    'inactive': { text: 'Inactiva', class: 'bg-secondary' }
                }
            }
        ],

        // Filters configuration
        filters: [
            {
                field: 'status',
                label: 'Estado',
                placeholder: 'Todos los Estados',
                options: [
                    { value: 'active', label: 'Activa' },
                    { value: 'inactive', label: 'Inactiva' }
                ]
            }
        ],

        // Actions configuration
        actionHandlers: {
            delete: deleteEntity
        },
        showViewButton: false, // Estaciones don't need a dedicated view page

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration (DynamicModal for Estaciones)
        editorType: 'modal',
        editorConfig: {
            title: 'Editor de Estación',
            fields: [
                { 
                    name: 'nombre', 
                    label: 'Nombre de la Estación', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Estación Saludable San Fernando'
                },
                { 
                    name: 'direccion', 
                    label: 'Dirección', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Av. Pte. Perón 1234, San Fernando'
                },
                { 
                    name: 'lat', 
                    label: 'Latitud', 
                    type: 'number', 
                    required: true,
                    placeholder: 'Ej: -34.4417',
                    step: 'any'
                },
                { 
                    name: 'lon', 
                    label: 'Longitud', 
                    type: 'number', 
                    required: true,
                    placeholder: 'Ej: -58.5594',
                    step: 'any'
                },
                { 
                    name: 'status', 
                    label: 'Estado', 
                    type: 'select',
                    options: [
                        { value: 'active', label: 'Activa' },
                        { value: 'inactive', label: 'Inactiva' }
                    ],
                    defaultValue: 'active'
                }
            ],
            customValidation: (formData) => {
                return estacionesService.validateEstacionData(formData);
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };

    // ============================================================================
    // EFFECTS & INITIALIZATION
    // ============================================================================

    // Load estaciones on component mount
    useEffect(() => {
        load();
    }, []);

    // ============================================================================
    // UI HANDLERS
    // ============================================================================

    const handleCreateNew = () => {
        // Open the editor via EntityTable reference
        if (tableRef.current && tableRef.current.handleCreateNew) {
            tableRef.current.handleCreateNew();
        }
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div className="content-section">
            <ContentHeader
                icon='fas fa-map-marked-alt'
                title='Estaciones'
                description='Estaciones'
                handleCreateNew={handleCreateNew}
                buttonText='Agregar Estación'
                disabledButton={loading}
            />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                data={{ data: entities, pagination }}
                                config={tableConfig}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EstacionesPage; 