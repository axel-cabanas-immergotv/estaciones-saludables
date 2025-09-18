import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import permissionsService from '../../../services/permissionsService';
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';
import ContentHeader from '../../../components/ContentHeader';

const PermissionsPage = () => {
    // State management (standard for all entities)
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const tableRef = useRef(null);

    // API methods (standard names for all entities)
    const load = async (page, limit, search, filters) => {
        setLoading(true);
        try {
            const params = {
                page: page || currentPage,
                limit: limit || pageSize,
                search: search !== undefined ? search : currentSearch,
                ...filters
            };

            const response = await permissionsService.get(params);
            
            if (response.success) {
                setPermissions(response.data);
                setPagination(response.pagination);
                setCurrentPage(params.page);
                setPageSize(params.limit);
                setCurrentSearch(params.search);
                setCurrentFilters(filters || {});
            } else {
                console.error('Error loading permissions:', response.message);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadForEditing = async (id) => {
        try {
            const response = await permissionsService.getById(id);
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Permission not found');
            }
        } catch (error) {
            console.error('Error loading permission for editing:', error);
            throw error;
        }
    };

    const save = async (data, id) => {
        try {
            let response;
            if (id) {
                response = await permissionsService.update(id, data);
            } else {
                response = await permissionsService.create(data);
            }
            
            if (response.success) {
                await load(); // Refresh the table
                return response.data;
            } else {
                throw new Error(response.message || 'Error saving permission');
            }
        } catch (error) {
            console.error('Error saving permission:', error);
            throw error;
        }
    };

    const deletePermission = async (id) => {
        if (!confirm('Are you sure you want to delete this permission?')) {
            return;
        }

        try {
            const response = await permissionsService.delete(id);
            if (response.success) {
                await load(); // Refresh the table
            } else {
                throw new Error(response.message || 'Error deleting permission');
            }
        } catch (error) {
            console.error('Error deleting permission:', error);
            throw error;
        }
    };

    // Listen for affiliate changes and reload data
    useAffiliateChange((affiliateId) => {
        console.log('Affiliate changed, reloading permissions...');
        load();
    }, []);

    // Load permissions on component mount
    useEffect(() => {
        load();
    }, []);

    // Table configuration
    const tableConfig = {
        tableId: 'permissions-table',
        entityType: 'permission',
        emptyMessage: 'No permissions found. Create your first permission!',
        enableSearch: true,
        
        columns: [
            {
                header: 'Permission',
                field: 'display_name',
                type: 'text-with-subtitle',
                subtitleField: 'name'
            },
            {
                header: 'Entity',
                field: 'entity',
                type: 'badge',
                badgeClass: (value) => {
                    switch(value) {
                        case 'users': return 'bg-primary';
                        case 'roles': return 'bg-secondary';
                        case 'permissions': return 'bg-info';
                        case 'pages': return 'bg-success';
                        case 'stories': return 'bg-warning';
                        case 'categories': return 'bg-dark';
                        case 'menus': return 'bg-light';
                        case 'modules': return 'bg-danger';
                        case 'affiliates': return 'bg-info';
                        default: return 'bg-light';
                    }
                }
            },
            {
                header: 'Action',
                field: 'action',
                type: 'badge',
                badgeClass: (value) => {
                    switch(value) {
                        case 'create': return 'bg-success';
                        case 'read': return 'bg-info';
                        case 'update': return 'bg-warning';
                        case 'delete': return 'bg-danger';
                        case 'update_own': return 'bg-warning';
                        case 'delete_own': return 'bg-danger';
                        default: return 'bg-light';
                    }
                }
            },
            {
                header: 'System',
                field: 'is_system',
                type: 'badge',
                badgeClass: (value) => value ? 'bg-info' : 'bg-light',
                render: (permission, value) => value ? 'System' : 'Custom'
            },
            {
                header: 'Created',
                field: 'created_at',
                type: 'date'
            }
        ],

        filters: [
            {
                field: 'entity',
                label: 'Entity Type',
                placeholder: 'All Entities',
                options: permissionsService.getEntityTypeOptions()
            },
            {
                field: 'action',
                label: 'Action Type',
                placeholder: 'All Actions',
                options: permissionsService.getActionTypeOptions()
            }
        ],

        actionHandlers: {
            delete: (type, id) => deletePermission(id)
        },
        showViewButton: false, // Permissions don't have a view page
        conditionalDelete: (permission) => !permission.is_system, // System permissions cannot be deleted

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration
        editorType: 'modal',
        editorConfig: {
            title: 'Permission Editor',
            getDefaultData: () => ({
                name: '',
                display_name: '',
                description: '',
                entity: 'users', // Default to 'users'
                action: 'read',  // Default to 'read'
                is_system: false
            }),
            fields: [
                { name: 'name', label: 'Permission Name', type: 'text', required: true, placeholder: 'e.g., users.create' },
                { name: 'display_name', label: 'Display Name', type: 'text', required: true, placeholder: 'e.g., Create Users' },
                { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Describe what this permission allows' },
                { name: 'entity', label: 'Entity Type', type: 'select', required: true, options: permissionsService.getEntityTypeOptions() },
                { name: 'action', label: 'Action Type', type: 'select', required: true, options: permissionsService.getActionTypeOptions() }
            ],
            customValidation: (formData) => {
                const errors = {};
                
                if (!formData.name || !formData.name.trim()) {
                    errors.name = 'Permission name is required';
                }
                
                if (!formData.display_name || !formData.display_name.trim()) {
                    errors.display_name = 'Display name is required';
                }
                
                if (!formData.entity) {
                    errors.entity = 'Entity type is required';
                }
                
                if (!formData.action) {
                    errors.action = 'Action type is required';
                }
                
                return errors;
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };

    // UI handlers
    const handleCreateNew = () => {
        if (tableRef.current && tableRef.current.handleCreateNew) {
            tableRef.current.handleCreateNew();
        }
    };

    return (
        <div className="content-section">
            <ContentHeader
                icon="fas fa-shield-alt"
                title="Permisos"
                description="Manage system permissions and access controls"
                handleCreateNew={() => {}}
                buttonText="Agregar Permiso"
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                // data={{ data: permissions, pagination }}
                                data={[]}
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

export default PermissionsPage; 