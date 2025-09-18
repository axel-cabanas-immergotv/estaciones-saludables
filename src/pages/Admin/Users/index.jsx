/**
 * Users Admin Page
 * Handles users management with table view and modal editing
 * Uses DynamicModal for CRUD operations
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EntityTable from '../../../components/EntityTable';
import usersService from '../../../services/usersService';
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';
import ContentHeader from '../../../components/ContentHeader';
import { useAffiliateId } from '../../../hooks/useAffiliateId';
import AccessLevelSelector from '../../../components/AccessLevelSelector';
import Swal from 'sweetalert2';

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
    const [availableRoles, setAvailableRoles] = useState([]); // Full role data with {id, name} format
    const [_affiliateOptions, setAffiliateOptions] = useState([]);
    const [currentUserAccess, setCurrentUserAccess] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const tableRef = useRef(null);
    const currentAffiliateId = useAffiliateId();

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
            console.log('🔍 loadForEditing called with id:', id);
            const response = await usersService.getById(id);
            if (response.success) {
                console.log('✅ User data loaded successfully:', response.data);
                
                // Load related data for editing (roles and affiliates)
                await loadRelatedData();
                
                // Load current user data for AccessLevelSelector
                await loadCurrentUserData();
                
                // Check if access_levels are already included in the response
                if (response.data.access_levels) {
                    console.log('✅ Access levels already included in response:', response.data.access_levels);
                } else {
                    console.log('⚠️ No access levels in response, setting empty array');
                    response.data.access_levels = [];
                }
                
                console.log('🚀 Returning final user data:', response.data);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to load user');
            }
        } catch (error) {
            console.error('❌ Error loading user for editing:', error);
            throw error;
        }
    };

    /**
     * Save entity (create or update)
     */
    const save = async (data, id = null) => {
        try {
            console.log('💾 save called with data:', data, 'id:', id);
            

            // Convert DNI to integer if present
            if (data.dni) {
                data.dni = parseInt(data.dni, 10);
            }

            // Set password to DNI if creating new user
            if (!id && data.dni) {
                data.password = data.dni.toString();
            }

            // Auto-assign current affiliate
            if (currentAffiliateId) {
                data.affiliate_ids = [currentAffiliateId];
            }

            // Extract access levels from data
            const accessLevels = data.access_levels || [];
            console.log('🔑 Extracted access levels:', accessLevels);
            delete data.access_levels; // Remove from user data

            let response;
            if (id) {
                console.log('🔄 Updating existing user with data:', data);
                response = await usersService.update(id, data);
            } else {
                console.log('🆕 Creating new user with data:', data);
                response = await usersService.create(data);
            }

            if (response.success) {
                const userId = id || response.data.id;
                console.log('✅ User saved successfully, userId:', userId);
                
                // Handle access levels if they were provided
                if (accessLevels.length > 0) {
                    console.log('🔑 Processing access levels:', accessLevels.length, 'levels');
                    try {
                        // First, delete existing access levels for this user
                        if (id) {
                            console.log('🗑️ Deleting existing access levels for user:', userId);
                            await fetch(`/api/admin/users/${userId}/access`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include'
                            });
                        }
                        
                        // Create new access level records
                        console.log('➕ Creating new access level records...');
                        const accessPromises = accessLevels.map(level => {
                            const accessData = {
                                user_id: userId,
                                status: 'active'
                            };
                            
                            // Map entity types to database fields
                            switch (level.entity_type) {
                                case 'localidades':
                                    accessData.localidad_id = level.entity_id;
                                    break;
                                case 'circuitos':
                                    accessData.circuito_id = level.entity_id;
                                    break;
                                case 'escuelas':
                                    accessData.escuela_id = level.entity_id;
                                    break;
                                case 'mesas':
                                    accessData.mesa_id = level.entity_id;
                                    break;
                            }
                            
                            console.log('🔑 Creating access record:', accessData);
                            
                            return fetch('/api/admin/users/access', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify(accessData)
                            });
                        });
                        
                        await Promise.all(accessPromises);
                        console.log('✅ All access levels created successfully');
                    } catch (accessError) {
                        console.error('❌ Error managing user access levels:', accessError);
                        // Don't fail the entire operation, just log the error
                    }
                } else {
                    console.log('ℹ️ No access levels to process');
                }
                
                // Refresh table after save
                console.log('🔄 Refreshing table data...');
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.message || response.error || 'Failed to save user');
            }
        } catch (error) {
            console.error('❌ Error saving user:', error);
            throw error;
        }
    };

    /**
     * Delete entity
     */
    const deleteEntity = async (entityType, id) => {
        try {
            console.log('🗑️ deleteEntity called with:', { entityType, id });
            
            // Show confirmation dialog
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) {
                return false;
            }

            const response = await usersService.delete(id);
            if (response.success) {
                // Show success message using API response
                await Swal.fire({
                    title: '¡Eliminado!',
                    text: response.message || 'El usuario ha sido eliminado correctamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Refresh table after deletion
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return true;
            } else {
                // Show error message using API response
                await Swal.fire({
                    title: 'Error',
                    text: response.message || 'Error al eliminar el usuario',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                throw new Error(response.message || 'Error al eliminar el usuario');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            // Show error message for unexpected errors
            await Swal.fire({
                title: 'Error',
                text: error.message || 'Ha ocurrido un error inesperado al eliminar el usuario',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            throw error;
        }
    };

    // ============================================================================
    // RELATED DATA LOADING
    // ============================================================================

    /**
     * Get available roles for current user based on role hierarchy
     */
    const getAvailableRolesForCurrentUser = useCallback(() => {
        console.log('🔍 getAvailableRolesForCurrentUser called');
        console.log('🔍 currentUserRole:', currentUserRole);
        console.log('🔍 roleOptions:', roleOptions);
        
        if (!currentUserRole?.name) {
            console.log('⚠️ No currentUserRole.name, returning empty array');
            return [];
        }

        const currentRoleName = currentUserRole.name;
        console.log('🔍 currentRoleName:', currentRoleName);
        
        // Define role hierarchy and restrictions based on backend
        const roleRestrictions = {
            'admin': ['jefe_campana', 'responsable_localidad', 'responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
            'jefe_campana': ['responsable_localidad', 'responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
            'responsable_localidad': ['responsable_seccion', 'responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
            'responsable_seccion': ['responsable_circuito', 'fiscal_general', 'fiscal_mesa', 'logistica'],
            'responsable_circuito': ['fiscal_general', 'fiscal_mesa', 'logistica'],
            'fiscal_general': ['fiscal_mesa', 'logistica'],
            'fiscal_mesa': [], // Cannot create users
            'logistica': [] // Cannot create users
        };

        const allowedRoleNames = roleRestrictions[currentRoleName] || [];
        console.log('🔍 allowedRoleNames:', allowedRoleNames);
        
        // roleOptions come from getRoleOptions() which returns {value, label} format
        // We need to get the actual role data with {id, name} format
        const filteredRoles = roleOptions.filter(role => {
            // Find the role by value (which is the id) in the available roles
            const availableRole = availableRoles.find(ar => ar.id === role.value);
            const isAllowed = availableRole && allowedRoleNames.includes(availableRole.name);
            console.log(`🔍 Role ${role.value} (${role.label}): availableRole=${!!availableRole}, name=${availableRole?.name}, allowed=${isAllowed}`);
            return isAllowed;
        });
        console.log('🔍 filteredRoles:', filteredRoles);
        
        return filteredRoles;
    }, [currentUserRole, roleOptions, availableRoles]);

    /**
     * Load related data (roles and affiliates)
     */
    const loadRelatedData = async () => {
        try {
            console.log('🔄 loadRelatedData called');
            
            const [roles, affiliates, availableRolesData] = await Promise.all([
                usersService.getRoleOptions(),
                usersService.getAffiliateOptions(),
                usersService.getAvailableRoles()
            ]);
            
            console.log('✅ Roles loaded:', roles);
            console.log('✅ Affiliates loaded:', affiliates);
            console.log('✅ Available roles loaded:', availableRolesData);
            
            setRoleOptions(roles);
            setAffiliateOptions(affiliates);
            setAvailableRoles(availableRolesData.success ? availableRolesData.data : []);
        } catch (error) {
            console.error('❌ Error loading related data:', error);
        }
    };

    /**
     * Load current user's access levels and role for AccessLevelSelector
     */
    const loadCurrentUserData = async () => {
        try {
            console.log('🔄 loadCurrentUserData called');
            
            // Load current user's access levels
            const accessResponse = await fetch('/api/admin/users/me/access');
            if (accessResponse.ok) {
                const accessData = await accessResponse.json();
                if (accessData.success) {
                    console.log('✅ Access levels loaded:', accessData.data);
                    setCurrentUserAccess(accessData.data || []);
                }
            }

            // Load current user's role
            const userResponse = await fetch('/api/auth/me');
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.success) {
                    console.log('✅ Current user role loaded:', userData.user.role);
                    setCurrentUserRole(userData.user.role);
                }
            }
        } catch (error) {
            console.error('❌ Error loading current user data:', error);
        }
    };

    // ============================================================================
    // TABLE CONFIGURATION
    // ============================================================================

    const tableConfig = useMemo(() => ({
        // Basic configuration
        tableId: 'users-table',
        entityType: 'user',
        emptyMessage: 'No users found. Create your first user to get started!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Nombre',
                field: 'full_name',
                type: 'text-with-subtitle',
                subtitleField: 'email'
            },
            {
                header: 'DNI',
                field: 'dni',
                type: 'text'
            },
            {
                header: 'Teléfono',
                field: 'telefono',
                type: 'text'
            },
            // {
            //     header: 'Rol',
            //     field: 'role_display',
            //     type: 'text'
            // },
            {
                header: 'Estado',
                field: 'status',
                type: 'badge',
                badgeMap: {
                    'active': { text: 'Activo', class: 'bg-success' },
                    'inactive': { text: 'Inactivo', class: 'bg-secondary' }
                }
            },
            {
                header: 'Último Login',
                field: 'last_login_at',
                type: 'date'
            }
        ],

        // Filters configuration
        filters: [
            {
                field: 'status',
                label: 'Estado',
                placeholder: 'Todos los Estados',
                options: [
                    { value: 'active', label: 'Activo' },
                    { value: 'inactive', label: 'Inactivo' }
                ]
            },
            {
                field: 'role_id',
                label: 'Rol',
                placeholder: 'Todos los Roles',
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
            title: 'Colaborador',
            fields: [
                { 
                    name: 'first_name', 
                    label: 'Nombre', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ingrese el nombre'
                },
                { 
                    name: 'last_name', 
                    label: 'Apellido', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Ingrese el apellido'
                },
                { 
                    name: 'email', 
                    label: 'Email', 
                    type: 'email', 
                    required: false,
                    placeholder: 'usuario@ejemplo.com'
                },
                { 
                    name: 'dni', 
                    label: 'DNI', 
                    type: 'number', 
                    required: true,
                    placeholder: 'Ingrese el DNI',
                    helpText: 'Documento Nacional de Identidad',
                    integerOnly: true
                },
                { 
                    name: 'telefono', 
                    label: 'Teléfono', 
                    type: 'tel',
                    required: true,
                    placeholder: 'Ingrese el número de teléfono'
                },
                // { 
                //     name: 'role_id', 
                //     label: 'Rol', 
                //     type: 'select',
                //     required: true,
                //     options: getAvailableRolesForCurrentUser(), // Get current options dynamically
                //     placeholder: 'Seleccione el rol'
                // },
                // Campo de niveles de acceso
                {
                    name: 'access_levels',
                    label: 'Asignaciones',
                    type: 'custom',
                    required: false,
                    helpText: 'Selecciona las asignaciones que tendrá este usuario',
                    render: (value, onChange, formData) => {

                        console.log('🔑 AccessLevelSelector render - value:', value);
                        // Get the selected role dynamically based on role_id
                        const roleId = formData?.role_id;
                        console.log('🔑 AccessLevelSelector render - roleId:', roleId, 'formData:', formData);
                        
                        // Find the selected role from availableRoles (which has the full role data)
                        const selectedRole = roleId ? 
                            availableRoles.find(role => role.id === parseInt(roleId)) : 
                            null;

                        console.log('🔑 selectedRole found:', selectedRole);
                        console.log('🔑 availableRoles:', availableRoles);

                        // Handle when AccessLevelSelector is ready
                        const handleReady = () => {
                            console.log('🔑 AccessLevelSelector is ready, updating value');
                            // Only update value when component is ready and we have a value
                            if (value && Array.isArray(value) && value.length > 0) {
                                onChange(value);
                            }
                        };

                        return (
                            <AccessLevelSelector
                                value={value}
                                onChange={onChange}
                                userRole={currentUserRole}
                                currentUserAccess={currentUserAccess}
                                selectedRole={selectedRole}
                                disabled={false}
                                onReady={handleReady}
                            />
                        );
                    }
                }
            ],
            customValidation: (formData) => {
                const errors = {};
                
                // Validate DNI is required and is a valid integer
                if (!formData.dni) {
                    errors.dni = 'DNI es requerido';
                } else {
                    const dniValue = parseInt(formData.dni, 10);
                    if (isNaN(dniValue) || dniValue <= 0 || !Number.isInteger(dniValue)) {
                        errors.dni = 'DNI debe ser un número entero válido';
                    }
                }

                // Validate phone is required
                if (!formData.telefono) {
                    errors.telefono = 'Teléfono es requerido';
                }

                // Set password to DNI if creating new user and password is empty
                if (!formData.id && !formData.password && formData.dni) {
                    formData.password = formData.dni.toString();
                }

                return errors;
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    }), [getAvailableRolesForCurrentUser, availableRoles, currentUserAccess, currentUserRole, deleteEntity, loadForEditing, save, load, currentPage, pageSize, currentSearch, currentFilters]);

    // ============================================================================
    // EFFECTS & INITIALIZATION
    // ============================================================================

    // Listen for affiliate changes and reload data
    useAffiliateChange(() => {
        console.log('Affiliate changed, reloading users...');
        load();
    }, []);

    // Load users on component mount
    useEffect(() => {
        load();
        loadCurrentUserData(); // Load current user data for AccessLevelSelector
    }, []);

    /**
     * Load options for filter dropdowns
     */
    const _loadFilterOptions = async () => {
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



    // ============================================================================
    // PERMISSIONS
    // ============================================================================

    /**
     * Función personalizada para verificar permisos en la tabla de usuarios
     * Todos los roles pueden gestionar usuarios EXCEPTO fiscal_mesa
     */
    const checkUsersPermissions = (user) => {
        // Si no hay usuario o rol, no permitir
        if (!user || !user.role || !user.role.name) {
            return false;
        }

        // fiscal_mesa no puede gestionar usuarios
        if (user.role.name === 'fiscal_mesa') {
            return false;
        }

        // Todos los demás roles sí pueden (admin, jefe_campana, responsable_localidad, etc.)
        return true;
    };

    // ============================================================================
    // UI HANDLERS
    // ============================================================================

    const handleCreateNew = async () => {
        // Open the editor immediately via EntityTable reference
        if (tableRef.current && tableRef.current.handleCreateNew) {
            tableRef.current.handleCreateNew();
        }
        
        // Load related data for new user asynchronously after modal opens
        try {
            await loadRelatedData();
            // Load current user data for AccessLevelSelector
            await loadCurrentUserData();
        } catch (error) {
            console.error('Error loading related data:', error);
        }
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div className="content-section">
            <ContentHeader
                title='Usuarios'
                description='Listado de tu equipo'
                handleCreateNew={() => {}}
                buttonText='Agregar Usuario'
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
                                checkPermissions={checkUsersPermissions}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage; 