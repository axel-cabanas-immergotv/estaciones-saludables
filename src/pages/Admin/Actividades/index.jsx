/**
 * Actividades Admin Page
 * Handles actividades management with table view and modal editing
 * Uses DynamicModal for CRUD operations
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EntityTable from '../../../components/EntityTable';
import actividadesService from '../../../services/actividadesService';
import estacionesService from '../../../services/estacionesService';
import ContentHeader from '../../../components/ContentHeader';

// Componente para seleccionar horarios
const HorarioSelector = ({ value, onChange }) => {
    const [selectedDays, setSelectedDays] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const diasSemana = useMemo(() => [
        { key: 'lun', label: 'Lunes' },
        { key: 'mar', label: 'Martes' },
        { key: 'mie', label: 'Miércoles' },
        { key: 'jue', label: 'Jueves' },
        { key: 'vie', label: 'Viernes' },
        { key: 'sab', label: 'Sábado' },
        { key: 'dom', label: 'Domingo' }
    ], []);

    // Parse existing value when component loads
    useEffect(() => {
        if (value && typeof value === 'string' && value.trim()) {
            parseHorarioString(value);
        }
    }, [value]);

    // Parse horario string like "Lunes a Viernes 8:00-9:00" or "Lunes, Miércoles y Viernes 19:00-20:00"
    const parseHorarioString = useCallback((horarioStr) => {
        try {
            // Extract time range
            const timeMatch = horarioStr.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            if (timeMatch) {
                setStartTime(timeMatch[1]);
                setEndTime(timeMatch[2]);
            }

            // Extract days
            const lowerStr = horarioStr.toLowerCase();
            const days = [];
            
            if (lowerStr.includes('lunes a viernes')) {
                days.push('lun', 'mar', 'mie', 'jue', 'vie');
            } else {
                diasSemana.forEach(dia => {
                    if (lowerStr.includes(dia.label.toLowerCase()) || lowerStr.includes(dia.key)) {
                        days.push(dia.key);
                    }
                });
            }
            
            setSelectedDays(days);
        } catch (error) {
            console.error('Error parsing horario:', error);
        }
    }, [diasSemana]);

    // Generate horario string and call onChange
    const updateHorario = (days, start, end) => {
        if (!days || days.length === 0 || !start || !end) {
            onChange('');
            return;
        }

        let dayString = '';
        
        // Check for common patterns
        const weekdays = ['lun', 'mar', 'mie', 'jue', 'vie'];
        const isWeekdays = weekdays.every(day => days.includes(day)) && days.length === 5;
        
        if (isWeekdays) {
            dayString = 'Lunes a Viernes';
        } else {
            // Convert keys to full names
            const dayNames = days.map(key => {
                const dia = diasSemana.find(d => d.key === key);
                return dia ? dia.label : key;
            });
            
            if (dayNames.length === 1) {
                dayString = dayNames[0];
            } else if (dayNames.length === 2) {
                dayString = dayNames.join(' y ');
            } else {
                dayString = dayNames.slice(0, -1).join(', ') + ' y ' + dayNames[dayNames.length - 1];
            }
        }

        const horarioString = `${dayString} ${start}-${end}`;
        onChange(horarioString);
    };

    const handleDayToggle = (dayKey) => {
        const newDays = selectedDays.includes(dayKey)
            ? selectedDays.filter(d => d !== dayKey)
            : [...selectedDays, dayKey];
        
        setSelectedDays(newDays);
        updateHorario(newDays, startTime, endTime);
    };

    const handleTimeChange = (type, time) => {
        if (type === 'start') {
            setStartTime(time);
            updateHorario(selectedDays, time, endTime);
        } else {
            setEndTime(time);
            updateHorario(selectedDays, startTime, time);
        }
    };

    return (
        <div className="horario-selector">
            <div className="mb-3">
                <label className="form-label">Días de la semana:</label>
                <div className="d-flex flex-wrap gap-2">
                    {diasSemana.map(dia => (
                        <div key={dia.key} className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`dia-${dia.key}`}
                                checked={selectedDays.includes(dia.key)}
                                onChange={() => handleDayToggle(dia.key)}
                            />
                            <label className="form-check-label" htmlFor={`dia-${dia.key}`}>
                                {dia.key.toUpperCase()}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="row">
                <div className="col-md-6">
                    <label className="form-label">Hora de inicio:</label>
                    <input
                        type="time"
                        className="form-control"
                        value={startTime}
                        onChange={(e) => handleTimeChange('start', e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label">Hora de fin:</label>
                    <input
                        type="time"
                        className="form-control"
                        value={endTime}
                        onChange={(e) => handleTimeChange('end', e.target.value)}
                    />
                </div>
            </div>
            
            {value && typeof value === 'string' && value.trim() && (
                <div className="mt-2">
                    <small className="text-muted">
                        <strong>Vista previa:</strong> {value}
                    </small>
                </div>
            )}
        </div>
    );
};

const ActividadesPage = () => {
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
    const [estacionOptions, setEstacionOptions] = useState([]);
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

            const response = await actividadesService.get(params);
            
            if (response.success) {
                // Format actividades for display
                const formattedActividades = response.data.map(actividad => 
                    actividadesService.formatActividadForDisplay(actividad)
                );
                
                setEntities(formattedActividades);
                setPagination(response.pagination);
                setCurrentPage(page);
                setPageSize(limit);
                setCurrentSearch(search);
                setCurrentFilters(filters);
            } else {
                console.error('Failed to load actividades:', response.error);
                setEntities([]);
                setPagination(null);
            }
        } catch (error) {
            console.error('Error loading actividades:', error);
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
            const response = await actividadesService.getById(id);
            if (response.success) {
                // Load related data for editing
                await loadRelatedData();
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to load actividad');
            }
        } catch (error) {
            console.error('Error loading actividad for editing:', error);
            throw error;
        }
    };

    /**
     * Save entity (create or update)
     */
    const save = async (data, id = null) => {
        try {
            // Validate data
            const validationErrors = actividadesService.validateActividadData(data);
            if (Object.keys(validationErrors).length > 0) {
                throw new Error('Validation failed: ' + Object.values(validationErrors).join(', '));
            }

            let response;
            if (id) {
                response = await actividadesService.update(id, data);
            } else {
                response = await actividadesService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save actividad');
            }
        } catch (error) {
            console.error('Error saving actividad:', error);
            throw error;
        }
    };

    /**
     * Delete entity
     */
    const deleteEntity = async (id) => {
        try {
            const response = await actividadesService.delete(id);
            if (response.success) {
                // Refresh table after deletion
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return true;
            } else {
                throw new Error(response.error || 'Failed to delete actividad');
            }
        } catch (error) {
            console.error('Error deleting actividad:', error);
            throw error;
        }
    };

    // ============================================================================
    // RELATED DATA LOADING
    // ============================================================================

    /**
     * Load related data (estaciones)
     */
    const loadRelatedData = async () => {
        try {
            const estaciones = await estacionesService.getEstacionOptions();
            setEstacionOptions(estaciones);
        } catch (error) {
            console.error('Error loading related data:', error);
        }
    };

    const tableConfig = {
        // Basic configuration
        tableId: 'actividades-table',
        entityType: 'actividad',
        emptyMessage: 'No hay actividades registradas. ¡Crea tu primera actividad para comenzar!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Actividad',
                field: 'nombre',
                type: 'text',
            },
            {
                header: 'Estación',
                field: 'estacion_nombre',
                type: 'text'
            },
            {
                header: 'Profesor',
                field: 'profesor',
                type: 'text'
            },
            {
                header: 'Horario',
                field: 'horario',
                type: 'text'
            },
            {
                header: 'Asistentes',
                field: 'asistentes_count',
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
            },
            {
                field: 'estacion_id',
                label: 'Estación',
                placeholder: 'Todas las Estaciones',
                options: [] // Will be populated dynamically
            }
        ],

        // Actions configuration
        actionHandlers: {
            delete: deleteEntity
        },
        showViewButton: false, // Actividades don't need a dedicated view page

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration (DynamicModal for Actividades)
        editorType: 'modal',
        editorConfig: {
            title: 'Editor de Actividad',
            fields: [
                { 
                    name: 'nombre', 
                    label: 'Nombre de la Actividad', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Yoga Matutino'
                },
                { 
                    name: 'profesor', 
                    label: 'Profesor', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ej: Ana García'
                },
                { 
                    name: 'horario', 
                    label: 'Horario', 
                    type: 'custom',
                    required: true,
                    render: (value, onChange) => {
                        // Ensure value is always a string
                        const safeValue = value && typeof value === 'string' ? value : '';
                        return (
                            <HorarioSelector 
                                value={safeValue} 
                                onChange={onChange}
                            />
                        );
                    }
                },
                { 
                    name: 'estacion_id', 
                    label: 'Estación', 
                    type: 'select',
                    required: true,
                    options: [], // Will be populated dynamically
                    placeholder: 'Seleccionar Estación'
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
                return actividadesService.validateActividadData(formData);
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };
    // ============================================================================
    // EFFECTS & INITIALIZATION
    // ============================================================================

    // Load actividades on component mount
    useEffect(() => {
        load();
    }, []);

    /**
     * Load options for filter dropdowns
     */
    const _loadFilterOptions = async () => {
        try {
            const estaciones = await estacionesService.getEstacionOptions();
            // Update filter options
            const updatedConfig = { ...tableConfig };
            const estacionFilter = updatedConfig.filters.find(f => f.field === 'estacion_id');
            if (estacionFilter) {
                estacionFilter.options = estaciones;
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    };

    // Update estacion options in editor config when loaded
    useEffect(() => {
        if (estacionOptions.length > 0) {
            const estacionField = tableConfig.editorConfig.fields.find(f => f.name === 'estacion_id');
            if (estacionField) {
                estacionField.options = estacionOptions;
            }
        }
    }, [estacionOptions, tableConfig.editorConfig.fields]);

    // ============================================================================
    // UI HANDLERS
    // ============================================================================

    const handleCreateNew = () => {
        // Load related data for new actividad
        loadRelatedData();
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
                icon='fas fa-running'
                title='Actividades'
                description='Gestión de actividades de las estaciones saludables'
                handleCreateNew={handleCreateNew}
                buttonText='Agregar Actividad'
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

export default ActividadesPage;