/**
 * Ciudadanos Admin Page
 * Handles ciudadanos management with table view and modal editing
 * Uses DynamicModal for CRUD operations
 */
import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import ciudadanosService from '../../../services/ciudadanosService';
import ContentHeader from '../../../components/ContentHeader';

const CiudadanosPage = () => {
    // ============================================================================
    // STATE MANAGEMENT (Standard for all entities)
    // ============================================================================
    const [loading, setLoading] = useState(false);
    const [entities, setEntities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const tableRef = useRef(null);

    // ============================================================================
    // DATA LOADING
    // ============================================================================
    
    const loadData = async () => {
        setLoading(true);
        try {
            const response = await ciudadanosService.get();
            if (response.success) {
                const formattedData = response.data.map(ciudadano => 
                    ciudadanosService.formatCiudadanoForDisplay(ciudadano)
                );
                setEntities(formattedData);
                setPagination(response.pagination);
            } else {
                console.error('Error loading ciudadanos:', response.error);
                setEntities([]);
                setPagination(null);
            }
        } catch (error) {
            console.error('Error loading ciudadanos:', error);
            setEntities([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDataChange = () => {
        // Refresh data after CRUD operations
        loadData();
    };

    // ============================================================================
    // TABLE CONFIGURATION
    // ============================================================================
    const tableConfig = {
        enableSearch: true,
        searchPlaceholder: 'Buscar por nombre, apellido, DNI o domicilio...',
        
        columns: [
            {
                header: 'Ciudadano',
                field: 'full_name',
                type: 'text',
            },
            {
                header: 'DNI',
                field: 'dni_formatted',
                type: 'text'
            },
            {
                header: 'Género',
                field: 'genero_display',
                type: 'text'
            },
            {
                header: 'Domicilio',
                field: 'domicilio',
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
                    'active': { text: 'Activo', class: 'bg-success' },
                    'inactive': { text: 'Inactivo', class: 'bg-secondary' }
                }
            }
        ],

        filters: [
            {
                field: 'genero',
                label: 'Género',
                type: 'select',
                options: [
                    { value: '', label: 'Todos los géneros' },
                    { value: 'masculino', label: 'Masculino' },
                    { value: 'femenino', label: 'Femenino' },
                    { value: 'otro', label: 'Otro' }
                ]
            },
            {
                field: 'status',
                label: 'Estado',
                type: 'select',
                options: [
                    { value: '', label: 'Todos los estados' },
                    { value: 'active', label: 'Activo' },
                    { value: 'inactive', label: 'Inactivo' }
                ]
            }
        ],

        editorType: 'modal',
        editorConfig: {
            title: 'Ciudadano',
            fields: [
                { 
                    name: 'nombre', 
                    label: 'Nombre', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Juan'
                },
                { 
                    name: 'apellido', 
                    label: 'Apellido', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Pérez'
                },
                { 
                    name: 'dni', 
                    label: 'DNI', 
                    type: 'number', 
                    required: true,
                    placeholder: 'Ej: 12345678'
                },
                { 
                    name: 'genero', 
                    label: 'Género', 
                    type: 'select',
                    options: [
                        { value: '', label: 'Seleccionar género' },
                        { value: 'masculino', label: 'Masculino' },
                        { value: 'femenino', label: 'Femenino' },
                        { value: 'otro', label: 'Otro' }
                    ]
                },
                { 
                    name: 'nacionalidad', 
                    label: 'Nacionalidad', 
                    type: 'text',
                    placeholder: 'Ej: Argentina'
                },
                { 
                    name: 'domicilio', 
                    label: 'Domicilio', 
                    type: 'text',
                    placeholder: 'Ej: Av. Corrientes 1234'
                },
                { 
                    name: 'codigo_postal', 
                    label: 'Código Postal', 
                    type: 'text',
                    placeholder: 'Ej: 1043'
                },
                { 
                    name: 'status', 
                    label: 'Estado', 
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'active', label: 'Activo' },
                        { value: 'inactive', label: 'Inactivo' }
                    ]
                }
            ]
        },

        actionHandlers: {
            get: ciudadanosService.get.bind(ciudadanosService),
            getById: ciudadanosService.getById.bind(ciudadanosService),
            create: ciudadanosService.create.bind(ciudadanosService),
            update: ciudadanosService.update.bind(ciudadanosService),
            delete: ciudadanosService.delete.bind(ciudadanosService),
            formatForDisplay: ciudadanosService.formatCiudadanoForDisplay.bind(ciudadanosService),
            validate: ciudadanosService.validateCiudadanoData.bind(ciudadanosService)
        },

        // Editor functions
        onLoadEntity: async (id) => {
            try {
                const response = await ciudadanosService.getById(id);
                if (response.success) {
                    return response.data;
                } else {
                    throw new Error(response.error || 'Failed to load ciudadano');
                }
            } catch (error) {
                console.error('Error loading ciudadano:', error);
                throw error;
            }
        },

        onSaveEntity: async (data, id) => {
            try {
                let response;
                if (id) {
                    // Update existing ciudadano
                    response = await ciudadanosService.update(id, data);
                } else {
                    // Create new ciudadano
                    response = await ciudadanosService.create(data);
                }
                
                if (response.success) {
                    // Refresh the data after successful save
                    handleDataChange();
                    return response.data;
                } else {
                    throw new Error(response.error || 'Failed to save ciudadano');
                }
            } catch (error) {
                console.error('Error saving ciudadano:', error);
                throw error;
            }
        }
    };

    // ============================================================================
    // LIFECYCLE HOOKS
    // ============================================================================
    
    useEffect(() => {
        loadData();
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
                icon='fas fa-users'
                title='Ciudadanos'
                description='Gestión de ciudadanos participantes en actividades'
                actions={[
                    {
                        label: 'Nuevo Ciudadano',
                        icon: 'fas fa-plus',
                        variant: 'primary',
                        onClick: handleCreateNew
                    }
                ]}
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
                                onDataChange={handleDataChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CiudadanosPage;