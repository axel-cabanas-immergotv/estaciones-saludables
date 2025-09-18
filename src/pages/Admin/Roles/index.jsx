import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import rolesService from '../../../services/rolesService';
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';
import ContentHeader from '../../../components/ContentHeader';

const RolesPage = () => {
    // State management (standard for all entities)
    const [roles, setRoles] = useState([]);
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

            const response = await rolesService.get(params);
            
            if (response.success) {
                setRoles(response.data);
                setPagination(response.pagination);
                setCurrentPage(params.page);
                setPageSize(params.limit);
                setCurrentSearch(params.search);
                setCurrentFilters(filters || {});
            } else {
                console.error('Error loading roles:', response.message);
            }
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadForEditing = async (id) => {
        try {
            const response = await rolesService.getById(id);
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Role not found');
            }
        } catch (error) {
            console.error('Error loading role for editing:', error);
            throw error;
        }
    };

    const save = async (data, id) => {
        try {
            let response;
            if (id) {
                response = await rolesService.update(id, data);
            } else {
                response = await rolesService.create(data);
            }
            
            if (response.success) {
                await load(); // Refresh the table
                return response.data;
            } else {
                throw new Error(response.message || 'Error saving role');
            }
        } catch (error) {
            console.error('Error saving role:', error);
            throw error;
        }
    };

    const deleteRole = async (id) => {
        if (!confirm('Are you sure you want to delete this role?')) {
            return;
        }

        try {
            const response = await rolesService.delete(id);
            if (response.success) {
                await load(); // Refresh the table
            } else {
                throw new Error(response.message || 'Error deleting role');
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            throw error;
        }
    };

    // Listen for affiliate changes and reload data
    useAffiliateChange((affiliateId) => {
        console.log('Affiliate changed, reloading roles...');
        load();
    }, []);

    // Load roles on component mount
    useEffect(() => {
        load();
    }, []);

    // Table configuration
    const tableConfig = {
        tableId: 'roles-table',
        entityType: 'role',
        emptyMessage: 'No roles found. Create your first role!',
        enableSearch: true,
        
        columns: [
            {
                header: 'Role',
                field: 'display_name',
                type: 'text-with-subtitle',
                subtitleField: 'name'
            },
            {
                header: 'Permissions',
                field: 'permissions_count',
                type: 'badge',
                badgeClass: (value) => {
                    if (value === 0) return 'bg-light';
                    if (value <= 5) return 'bg-success';
                    if (value <= 10) return 'bg-warning';
                    return 'bg-danger';
                },
                render: (role, value) => `${value || 0} permissions`
            },
            {
                header: 'System',
                field: 'is_system',
                type: 'badge',
                badgeClass: (value) => value ? 'bg-info' : 'bg-light',
                render: (role, value) => value ? 'System' : 'Custom'
            },
            {
                header: 'Status',
                field: 'status',
                type: 'badge',
                badgeClass: (value) => value === 'active' ? 'bg-success' : 'bg-warning'
            },
            {
                header: 'Created',
                field: 'created_at',
                type: 'date'
            }
        ],

        filters: [
            {
                field: 'status',
                label: 'Status',
                placeholder: 'All Statuses',
                options: rolesService.getStatusOptions()
            }
        ],

        actionHandlers: {
            delete: (type, id) => deleteRole(id)
        },
        showViewButton: false, // Roles don't have a view page
        conditionalDelete: (role) => !role.is_system, // System roles cannot be deleted

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration
        editorType: 'modal',
        editorConfig: {
            title: 'Role Editor',
            fields: [
                { name: 'name', label: 'Role Name', type: 'text', required: true, placeholder: 'e.g., editor' },
                { name: 'display_name', label: 'Display Name', type: 'text', required: true, placeholder: 'e.g., Editor' },
                { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Describe what this role allows' },
                { name: 'status', label: 'Status', type: 'select', options: rolesService.getStatusOptions(), defaultValue: 'active' }
            ],
            customValidation: (formData) => {
                const errors = {};
                
                if (!formData.name || !formData.name.trim()) {
                    errors.name = 'Role name is required';
                }
                
                if (!formData.display_name || !formData.display_name.trim()) {
                    errors.display_name = 'Display name is required';
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
                icon="fas fa-user-tag"
                title="Roles"
                description="Manage user roles and their permissions"
                handleCreateNew={handleCreateNew}
                buttonText="Add New Role"
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                // data={{ data: roles, pagination }}
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

export default RolesPage; 