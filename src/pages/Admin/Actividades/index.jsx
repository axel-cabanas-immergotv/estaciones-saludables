import React, { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import seccionService from '../../../services/seccionService';
import ContentHeader from '../../../components/ContentHeader';

const Seccion = () => {
    const [entities, setEntities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const tableRef = useRef(null);

    useEffect(() => {
        load();
    }, [currentPage, currentSearch, currentFilters]);

    const load = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: pageSize,
                search: currentSearch,
                filters: currentFilters,
            };
            const response = await seccionService.get(params);
            setEntities(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error loading seccion:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (search) => {
        setCurrentSearch(search);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleFiltersChange = (filters) => {
        setCurrentFilters(filters);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const loadForEditing = async (id) => {
        try {
            console.log('loadForEditing id:', id);
            const response = await seccionService.getById(id);
            if (response.success) {
                // Load related data for editing
                // await loadRelatedData();
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to load user');
            }
        } catch (error) {
            console.error('Error loading user for editing:', error);
            throw error;
        }
    };

    const deleteEntity = async (id) => {
        try {
            const response = await seccionService.delete(id);
            if (response.success) {
                // Refresh table after deletion
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return true;
            } else {
                throw new Error(response.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    };

    const save = async (data, id = null) => {
        try {
            let response;
            console.log('update data:', data, ` - id: ${id}`);
            if (id) {
                response = await seccionService.update(id, data);
            } else {
                response = await seccionService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save seccion');
            }
        } catch (error) {
            console.error('Error saving seccion:', error);
            throw error;
        }
    };

    const tableConfig = {
        // Basic configuration
        tableId: 'secciones-table',
        entityType: 'seccion',
        emptyMessage: 'No secciones found. Create your first seccion to get started!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Numero',
                field: 'numero',
                type: 'text'
            },
        ],

        // Filters configuration
        filters: [],

        // Actions configuration
        actionHandlers: {
            delete: deleteEntity
        },
        showViewButton: false, // Users don't need a dedicated view page
        conditionalDelete: (user) => !user.is_system, // Prevent deletion of system users

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration (DynamicModal for Users)
        editorType: 'modal',
        editorConfig: {
            title: 'Actividad Editor',
            fields: [
                {
                    name: 'numero',
                    label: 'Numero',
                    type: 'text', 
                    required: true,
                    placeholder: 'Ingrese el numero de la seccion'
                }
            ],
            customValidation: (formData) => {
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };
    
    return (
        <div className="content-section">
            <ContentHeader
                icon='fas fa-map-marked-alt'
                title='Actividades'
                description='Actividades'
            />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                // data={{ data: entities, pagination }}
                                data={[]}
                                config={tableConfig}
                                loading={loading}
                                onPageChange={handlePageChange}
                                onSearchChange={handleSearchChange}
                                onFiltersChange={handleFiltersChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Seccion;