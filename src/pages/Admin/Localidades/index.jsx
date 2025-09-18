/**
 * Users Admin Page
 * Handles users management with table view and modal editing
 * Uses DynamicModal for CRUD operations
 */
import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import usersService from '../../../services/usersService';
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';
import ContentHeader from '../../../components/ContentHeader';

const UsersPage = () => {
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
    const [roleOptions, setRoleOptions] = useState([]);
    const [affiliateOptions, setAffiliateOptions] = useState([]);
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

            const response = await usersService.get(params);
            
            if (response.success) {
                // Format users for display
                const formattedUsers = response.data.map(user => 
                    usersService.formatUserForDisplay(user)
                );
                
                setEntities(formattedUsers);
                setPagination(response.pagination);
                setCurrentPage(page);
                setPageSize(limit);
                setCurrentSearch(search);
                setCurrentFilters(filters);
            } else {
                console.error('Failed to load users:', response.error);
                setEntities([]);
                setPagination(null);
            }
        } catch (error) {
            console.error('Error loading users:', error);
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
            const response = await usersService.getById(id);
            if (response.success) {
                // Load related data for editing
                await loadRelatedData();
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to load user');
            }
        } catch (error) {
            console.error('Error loading user for editing:', error);
            throw error;
        }
    };

    /**
     * Save entity (create or update)
     */
    const save = async (data, id = null) => {
        try {


            let response;
            if (id) {
                response = await usersService.update(id, data);
            } else {
                response = await usersService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    };

    /**
     * Delete entity
     */
    const deleteEntity = async (id) => {
        try {
            const response = await usersService.delete(id);
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

    // ============================================================================
    // RELATED DATA LOADING
    // ============================================================================

    /**
     * Load related data (roles and affiliates)
     */
    const loadRelatedData = async () => {
        try {
            const [roles, affiliates] = await Promise.all([
                usersService.getRoleOptions(),
                usersService.getAffiliateOptions()
            ]);
            
            setRoleOptions(roles);
            setAffiliateOptions(affiliates);
        } catch (error) {
            console.error('Error loading related data:', error);
        }
    };

    // ============================================================================
    // TABLE CONFIGURATION
    // ============================================================================

    const tableConfig = {
        // Basic configuration
        tableId: 'users-table',
        entityType: 'user',
        emptyMessage: 'No users found. Create your first user to get started!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'User',
                field: 'full_name',
                type: 'text-with-subtitle',
                subtitleField: 'email'
            },

            {
                header: 'Role',
                field: 'role_display',
                type: 'text'
            },
            {
                header: 'Status',
                field: 'status',
                type: 'badge',
                badgeMap: {
                    'active': { text: 'Active', class: 'bg-success' },
                    'inactive': { text: 'Inactive', class: 'bg-secondary' }
                }
            },
            {
                header: 'Last Login',
                field: 'last_login_at',
                type: 'date'
            }
        ],

        // Filters configuration
        filters: [
            {
                field: 'status',
                label: 'Status',
                placeholder: 'All Statuses',
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                ]
            },
            {
                field: 'role_id',
                label: 'Role',
                placeholder: 'All Roles',
                options: [] // Will be populated dynamically
            }
        ],

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
            title: 'User Editor',
            fields: [
                { 
                    name: 'first_name', 
                    label: 'First Name', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Enter first name'
                },
                { 
                    name: 'last_name', 
                    label: 'Last Name', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Enter last name'
                },
                { 
                    name: 'email', 
                    label: 'Email', 
                    type: 'email', 
                    required: true,
                    placeholder: 'user@example.com'
                },
                
                { 
                    name: 'password', 
                    label: 'Password', 
                    type: 'custom',
                    render: (value, onChange, formData) => {
                        const isEditing = !!formData.id;
                        return (
                            <div>
                                <input 
                                    type="password" 
                                    className="form-control"
                                    placeholder="Enter password"
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    required={!isEditing}
                                />
                                {isEditing && (
                                    <small className="form-text text-muted">
                                        Leave empty to keep current password
                                    </small>
                                )}
                            </div>
                        );
                    }
                },
                { 
                    name: 'role_id', 
                    label: 'Role', 
                    type: 'select',
                    required: true,
                    options: [], // Will be populated dynamically
                    placeholder: 'Select Role'
                },
                { 
                    name: 'status', 
                    label: 'Status', 
                    type: 'select',
                    options: [
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ],
                    defaultValue: 'active'
                },
                { 
                    name: 'affiliate_ids', 
                    label: 'Affiliates', 
                    type: 'custom',
                    render: (value, onChange, formData) => {
                        // For now, simple multi-select. Can be enhanced later
                        return (
                            <div>
                                <select 
                                    className="form-control"
                                    multiple
                                    value={value || []}
                                    onChange={(e) => {
                                        const selectedValues = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                        onChange(selectedValues);
                                    }}
                                    style={{ minHeight: '100px' }}
                                >
                                    {affiliateOptions.map(affiliate => (
                                        <option key={affiliate.value} value={affiliate.value}>
                                            {affiliate.label}
                                        </option>
                                    ))}
                                </select>
                                <small className="form-text text-muted">
                                    Hold Ctrl/Cmd to select multiple affiliates
                                </small>
                            </div>
                        );
                    }
                }
            ],
            customValidation: (formData) => {
                return {};
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };

    // ============================================================================
    // EFFECTS & INITIALIZATION
    // ============================================================================

    // Listen for affiliate changes and reload data
    useAffiliateChange((affiliateId) => {
        console.log('Affiliate changed, reloading users...');
        load();
    }, []);

    // Load users on component mount
    useEffect(() => {
        load();
    }, []);

    /**
     * Load options for filter dropdowns
     */
    const loadFilterOptions = async () => {
        try {
            const roles = await usersService.getRoleOptions();
            // Update filter options
            const updatedConfig = { ...tableConfig };
            const roleFilter = updatedConfig.filters.find(f => f.field === 'role_id');
            if (roleFilter) {
                roleFilter.options = roles;
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    };

    // Update role and affiliate options in editor config when loaded
    useEffect(() => {
        if (roleOptions.length > 0) {
            const roleField = tableConfig.editorConfig.fields.find(f => f.name === 'role_id');
            if (roleField) {
                roleField.options = roleOptions;
            }
        }
    }, [roleOptions]);

    // ============================================================================
    // UI HANDLERS
    // ============================================================================

    const handleCreateNew = () => {
        // Load related data for new user
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
                icon='fas fa-map-marked-alt'
                title='Estaciones'
                description='Estaciones'
                handleCreateNew={() => {}}
                buttonText='Agregar Estación'
                disabledButton={loading}
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
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage; 