import React, { useState, useEffect, useRef, useCallback } from 'react';
import EntityTable from '../../../components/EntityTable';
import escuelaService from '../../../services/escuelaService';
import ContentHeader from '../../../components/ContentHeader';
import DynamicModal from '../../../components/DynamicModal';
import AccessLevelSelector from '../../../components/AccessLevelSelector';
import { useAffiliateId } from '../../../hooks/useAffiliateId';
import usersService from '../../../services/usersService';
import Swal from 'sweetalert2';
import './escuela.css';
import Badge from '../../../components/Badge';

const Escuela = () => {
    const [entities, setEntities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [currentSortBy, setCurrentSortBy] = useState(null);
    const [currentSortOrder, setCurrentSortOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [escuela, setEscuela] = useState(null);
    const [showFiscalModal, setShowFiscalModal] = useState(false);
    const [selectedFiscal, setSelectedFiscal] = useState(null);
    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [savingCollaborator, setSavingCollaborator] = useState(false);
    const [currentUserAccess, setCurrentUserAccess] = useState([]);
    const [userData, setUserData] = useState(null);
    const tableRef = useRef(null);
    const affiliateId = useAffiliateId();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: pageSize,
                search: currentSearch,
                filters: currentFilters,
            };
            
            // Add sorting parameters if they exist
            if (currentSortBy && currentSortOrder) {
                params.order_by = currentSortBy;
                params.sort = currentSortOrder;
            }
            
            const response = await escuelaService.get(params);
            setEntities(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error loading escuela:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, currentSearch, currentFilters, currentSortBy, currentSortOrder]);

    // Initial load - only once when component mounts or affiliateId changes
    useEffect(() => {
        loadAvailableRoles();
        loadUserData();
    }, [affiliateId]);

    // Data load - when search/pagination/sorting parameters change
    useEffect(() => {
        load();
    }, [load]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (searchTerm, filters) => {
        setCurrentSearch(searchTerm);
        setCurrentFilters(filters);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleSortChange = (sortBy, sortOrder) => {
        setCurrentSortBy(sortBy);
        setCurrentSortOrder(sortOrder);
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    const loadForEditing = async (id) => {
        try {
            console.log('loadForEditing id:', id);
            const response = await escuelaService.getById(id);
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
            const response = await escuelaService.delete(id);
            if (response.success) {
                // Refresh table after deletion
                await load();
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
                response = await escuelaService.update(id, data);
            } else {
                response = await escuelaService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load();
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save escuela');
            }
        } catch (error) {
            console.error('Error saving escuela:', error);
            throw error;
        }
    };

    const handleClick = (entity) => {
        console.log("entity", entity);
        // Render a new page with the entity data
        setEscuela(entity);
    };

    const handleFiscalClick = (fiscalData, mesaData = null) => {
        console.log("Fiscal clicked:", fiscalData);
        setSelectedFiscal({
            ...fiscalData,
            mesa: mesaData
        });
        setShowFiscalModal(true);
    };

    const closeFiscalModal = () => {
        setShowFiscalModal(false);
        setSelectedFiscal(null);
    };

    const removeFiscalAssignment = async (userId, mesaId) => {
        try {
            // Show confirmation dialog
            if (!window.confirm('¿Está seguro de que desea eliminar esta asignación de fiscal?')) {
                return;
            }

            // Make API call to remove user access for this specific mesa
            const response = await fetch('/api/admin/users/access', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: userId,
                    mesa_id: mesaId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Update local state instead of reloading from API
                setEscuela(prevEscuela => {
                    // Clone the escuela object to avoid mutations
                    const updatedEscuela = { ...prevEscuela };
                    
                    // Remove the fiscal from mesasConFiscal array
                    if (updatedEscuela.mesasConFiscal) {
                        updatedEscuela.mesasConFiscal = updatedEscuela.mesasConFiscal.filter(
                            item => !(item.user_id === userId && item.mesa_id === mesaId)
                        );
                    }
                    
                    // Update mesasSinFiscal - add the mesa if it doesn't have any other fiscals
                    if (updatedEscuela.mesas && updatedEscuela.mesasSinFiscal) {
                        const targetMesa = updatedEscuela.mesas.find(mesa => mesa.id === mesaId);
                        if (targetMesa) {
                            // Check if this mesa still has other fiscals assigned
                            const remainingFiscalsForMesa = updatedEscuela.mesasConFiscal.filter(
                                item => item.mesa_id === mesaId
                            );
                            
                            // If no fiscals remain for this mesa, add it to mesasSinFiscal
                            if (remainingFiscalsForMesa.length === 0) {
                                const mesaAlreadyInSinFiscal = updatedEscuela.mesasSinFiscal.some(
                                    mesa => mesa.id === mesaId
                                );
                                if (!mesaAlreadyInSinFiscal) {
                                    updatedEscuela.mesasSinFiscal.push(targetMesa);
                                }
                            }
                        }
                    }
                    
                    // Update counters
                    updatedEscuela.cantidadMesasCfiscal = updatedEscuela.mesasConFiscal?.length || 0;
                    updatedEscuela.cantidadMesasSFiscal = updatedEscuela.mesasSinFiscal?.length || 0;
                    
                    return updatedEscuela;
                });
                
                // Show success message
                alert('Asignación eliminada correctamente');
            } else {
                throw new Error(result.message || 'Error al eliminar la asignación');
            }
        } catch (error) {
            console.error('Error removing fiscal assignment:', error);
            alert('Error al eliminar la asignación: ' + error.message);
        }
    };

    const loadUserData = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUserData(data.user);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadAvailableRoles = async () => {
        try {
            // Get available roles based on current user's role
            const response = await usersService.getAvailableRoles();
            if (response.success) {
                setAvailableRoles(response.data || []);
            }
        } catch (error) {
            console.error('Error loading available roles:', error);
            // Fallback to basic roles if API fails
            setAvailableRoles([
                { id: 3, name: 'Responsable de Localidad', display_name: 'Responsable de Localidad' },
                { id: 4, name: 'Responsable de Sección', display_name: 'Responsable de Sección' },
                { id: 5, name: 'Responsable de Circuito', display_name: 'Responsable de Circuito' },
                { id: 6, name: 'Fiscal General', display_name: 'Fiscal General' },
                { id: 7, name: 'Fiscal de Mesa', display_name: 'Fiscal de Mesa' },
                { id: 8, name: 'Logística', display_name: 'Logística' }
            ]);
        }
    };

    const loadCurrentUserAccess = async () => {
        try {
            const response = await fetch('/api/admin/users/me/access');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return data.data || [];
                }
            }
        } catch (error) {
            console.error('Error loading current user access:', error);
        }
        return [];
    };

    const getAvailableRolesForCurrentUser = () => {
        if (!userData?.role?.name) return [];

        const currentRoleName = userData.role.name;
        
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
        
        return availableRoles.filter(role => allowedRoleNames.includes(role.name));
    };

    const handleAddCollaborator = async () => {
        const availableRoles = getAvailableRolesForCurrentUser();
        if (availableRoles.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Permisos Insuficientes',
                text: 'No tienes permisos para crear colaboradores con tu rol actual',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Load current user's access levels before opening modal
        const userAccess = await loadCurrentUserAccess();
        setCurrentUserAccess(userAccess);
        setShowAddCollaboratorModal(true);
    };

    const handleSaveCollaborator = async (formData) => {
        try {
            setSavingCollaborator(true);
            

            // Convert DNI to integer if present
            if (formData.dni) {
                formData.dni = parseInt(formData.dni, 10);
            }

            // Set password to DNI if creating new user
            if (formData.dni) {
                formData.password = formData.dni.toString();
            }

            // Auto-assign current affiliate
            if (affiliateId) {
                formData.affiliate_ids = [affiliateId];
            }

            // Create user first
            const response = await usersService.create(formData);
            
            if (response.success) {
                const newUserId = response.data.id;
                
                // Create user access records if access levels were selected
                if (formData.access_levels && formData.access_levels.length > 0) {
                    try {
                        const accessPromises = formData.access_levels.map(level => {
                            const accessData = {
                                user_id: newUserId,
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
                            
                            return fetch('/api/admin/users/access', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify(accessData)
                            });
                        });
                        
                        await Promise.all(accessPromises);
                    } catch (accessError) {
                        console.error('Error creating user access records:', accessError);
                        // Don't fail the entire operation, just log the error
                    }
                }
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: '¡Colaborador Creado!',
                    text: 'El colaborador ha sido creado exitosamente',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#28a745',
                    timer: 3000,
                    timerProgressBar: true
                });
                
                // Close modal and refresh data
                setShowAddCollaboratorModal(false);
                
                // If we're viewing a specific escuela, refresh its data
                // Otherwise, refresh the general escuelas list
                if (escuela) {
                    // Refresh the specific escuela data to show new fiscal assignments
                    const updatedEscuela = await escuelaService.getById(escuela.id);
                    if (updatedEscuela.success) {
                        setEscuela(updatedEscuela.data);
                    }
                } else {
                    // Refresh the escuelas list
                    await load();
                }
                
            } else {
                throw new Error(response.error || 'Error al crear colaborador');
            }
        } catch (error) {
            console.error('Error creating collaborator:', error);
            
            // Parse error message to show user-friendly messages
            let errorMessage = 'Error al crear colaborador';
            let errorTitle = 'Error';
            
            if (error.message) {
                // Check for specific error types from backend
                if (error.message.includes('teléfono ya está registrado')) {
                    errorTitle = 'Teléfono Duplicado';
                    errorMessage = 'El número de teléfono ya está registrado en el sistema. Por favor, utiliza un número diferente.';
                } else if (error.message.includes('DNI ya está registrado')) {
                    errorTitle = 'DNI Duplicado';
                    errorMessage = 'El DNI ya está registrado en el sistema. Por favor, verifica el número ingresado.';
                } else if (error.message.includes('email ya está registrado')) {
                    errorTitle = 'Email Duplicado';
                    errorMessage = 'El email ya está registrado en el sistema. Por favor, utiliza un email diferente.';
                } else if (error.message.includes('nombre de usuario ya está registrado')) {
                    errorTitle = 'Usuario Duplicado';
                    errorMessage = 'El nombre de usuario ya está registrado en el sistema. Por favor, utiliza un nombre diferente.';
                } else if (error.message.includes('Error de validación')) {
                    errorTitle = 'Datos Incompletos';
                    errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
                } else if (error.message.includes('Referencia inválida')) {
                    errorTitle = 'Datos Inválidos';
                    errorMessage = 'Uno de los datos ingresados hace referencia a un registro que no existe.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            Swal.fire({
                icon: 'error',
                title: errorTitle,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc3545',
                showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                }
            });
        } finally {
            setSavingCollaborator(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddCollaboratorModal(false);
    };


    // Toggle apertura state for escuela
    const toggleApertura = async (escuela) => {
        try {
            const newState = !escuela.abierto;
            console.log(`Toggling escuela ${escuela.id} apertura to:`, newState);
            
            const response = await escuelaService.update(escuela.id, {
                ...escuela,
                abierto: newState
            });

            if (response.success) {
                // Update local state immediately for better UX
                setEntities(prevEntities => 
                    prevEntities.map(entity => 
                        entity.id === escuela.id 
                            ? { ...entity, abierto: newState }
                            : entity
                    )
                );
                
                console.log(`Escuela ${escuela.nombre} ${newState ? 'abrió' : 'cerró'} exitosamente`);
            } else {
                throw new Error(response.error || 'Failed to update escuela apertura');
            }
        } catch (error) {
            console.error('Error toggling escuela apertura:', error);
            alert('Error al actualizar el estado de apertura: ' + error.message);
        }
    };

    // Check if current user is fiscal general
    const isFiscalGeneral = () => {
        return userData?.role?.name === 'fiscal_general';
    };

    // Custom permission check for EntityTable - solo admin para botones estándar
    const checkEscuelaPermissions = (user) => {
        // Solo admin puede ver botones estándar (edit, delete)
        return user?.role?.name === 'admin';
    };

    // Permission check específico para custom actions (fiscal_general)
    const checkCustomActionPermissions = (user) => {
        // Fiscal general puede ver custom actions (switch)
        return user?.role?.name === 'fiscal_general';
    };

    // Function to calculate background color based on fiscal completion percentage
    const getRowBackgroundColor = (entity) => {
        const total = entity.cantidadMesas || 0;
        const conFiscal = entity.cantidadMesasCfiscal || 0;
        
        if (total === 0) return { backgroundColor: 'rgba(200, 200, 200, 0.15)' }; // Light gray for no mesas
        
        const porcentaje = (conFiscal / total) * 100;
        
        // Smooth color gradient from red (0%) to green (100%)
        if (porcentaje === 0) {
            return { backgroundColor: 'rgba(255, 182, 193, 0.25)' }; // Light red pastel
        } else if (porcentaje <= 20) {
            return { backgroundColor: 'rgba(255, 160, 160, 0.25)' }; // Red pastel
        } else if (porcentaje <= 40) {
            return { backgroundColor: 'rgba(255, 180, 160, 0.25)' }; // Red-orange pastel
        } else if (porcentaje <= 60) {
            return { backgroundColor: 'rgba(255, 200, 160, 0.25)' }; // Orange pastel
        } else if (porcentaje <= 80) {
            return { backgroundColor: 'rgba(255, 220, 160, 0.25)' }; // Yellow-orange pastel
        } else if (porcentaje < 100) {
            return { backgroundColor: 'rgba(200, 255, 200, 0.25)' }; // Light green pastel
        } else {
            return { backgroundColor: 'rgba(144, 238, 144, 0.25)' }; // Green pastel
        }
    };

    // console.log("entities", entities);
    const tableConfig = {
        // Basic configuration
        tableId: 'escuelas-table',
        entityType: 'escuela',
        emptyMessage: 'No escuelas found. Create your first escuela to get started!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Nombre',
                field: 'nombre',
                type: 'text',
                sortable: true,
                sortField: 'nombre'
            },
            {
                header: 'Dirección',
                field: 'calle',
                type: 'text',
                sortable: true,
                sortField: 'calle'
            },
            {
                header: 'Circuito',
                field: 'circuito.nombre',
                type: 'text',
                sortable: true,
                sortField: 'circuito'
            },
            {
                header: 'FG',
                field: 'fiscalesGeneralesNames',
                type: 'custom',
                render: (entity) => {
                    // Primero intentamos usar datos completos de fiscalesGenerales
                    if (entity.fiscalesGenerales && entity.fiscalesGenerales.length > 0) {
                        return (
                            <div className="d-flex flex-wrap gap-1">
                                {entity.fiscalesGenerales.map((fiscal, index) => (
                                    <Badge
                                        key={index}
                                        text={`${fiscal.user.first_name} ${fiscal.user.last_name}`}
                                        variant="success"
                                        icon="fa-user-tie"
                                        clickable={true}
                                        onClick={() => handleFiscalClick(fiscal.user)}
                                        title="Click para ver detalles del fiscal general"
                                        size='lg'
                                    />
                                ))}
                            </div>
                        );
                    }
                    
                    // Fallback: usar fiscalesGeneralesNames si no hay datos completos
                    if (entity.fiscalesGeneralesNames && entity.fiscalesGeneralesNames.trim()) {
                        const names = entity.fiscalesGeneralesNames.split('||').filter(name => name.trim());
                        if (names.length > 0) {
                            return (
                                <div className="d-flex flex-wrap gap-1">
                                    {names.map((name, index) => (
                                        <span
                                            key={index}
                                            className="badge bg-success clickable-tag"
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Crear objeto fiscal mínimo solo con nombre
                                                const fiscalData = {
                                                    first_name: name.trim().split(' ')[0] || '',
                                                    last_name: name.trim().split(' ').slice(1).join(' ') || '',
                                                    dni: 'No disponible',
                                                    email: 'No disponible',
                                                    telefono: 'No disponible',
                                                    direccion: 'No disponible'
                                                };
                                                handleFiscalClick(fiscalData);
                                            }}
                                            title="Click para ver detalles del fiscal general (información limitada)"
                                        >
                                            <i className="fas fa-user-tie me-1"></i>
                                            {name.trim()}
                                        </span>
                                    ))}
                                </div>
                            );
                        }
                    }
                    
                    // Si no hay fiscales generales
                    return <span className="text-muted">-</span>;
                }
            },
            {
                header: '# FG',
                field: 'cantidadFiscalesGenerales',
                type: 'text',
                sortable: true,
                sortField: 'cantidadFiscalesGenerales'
            },
            {
                header: 'Mesas',
                field: 'cantidadMesas',
                type: 'text',
                sortable: true,
                sortField: 'cantidadMesas'
            },
            {
                header: 'Mesas C/Fiscal',
                field: 'cantidadMesasCfiscal',
                type: 'text',
                sortable: true,
                sortField: 'cantidadMesasCfiscal'
            },
            {
                header: 'Mesas S/Fiscal',
                field: 'cantidadMesasSFiscal',
                type: 'text',
                sortable: true,
                sortField: 'cantidadMesasSFiscal'
            },
            {
                header: '% C/Fiscal',
                field: 'cantidadMesasCfiscal',
                type: 'custom',
                render: (entity) => {
                    const total = entity.cantidadMesas || 0;
                    const conFiscal = entity.cantidadMesasCfiscal || 0;
                    const porcentaje = total > 0 ? Math.round((conFiscal / total) * 100) : 0;
                    
                    // Get color for the indicator
                    let indicatorColor = '#ccc'; // Default gray
                    if (total > 0) {
                        if (porcentaje === 0) {
                            indicatorColor = '#ff6b6b'; // Red
                        } else if (porcentaje <= 40) {
                            indicatorColor = '#ffa500'; // Orange
                        } else if (porcentaje <= 80) {
                            indicatorColor = '#ffd700'; // Yellow
                        } else {
                            indicatorColor = '#32cd32'; // Green
                        }
                    }
                    
                    return (
                        <div className="d-flex align-items-center">
                            <span 
                                className="percentage-indicator" 
                                style={{ backgroundColor: indicatorColor }}
                                title={`${porcentaje}% de mesas con fiscal`}
                            ></span>
                            <span className="fw-bold">{porcentaje}%</span>
                        </div>
                    );
                }
            },
        ],

        // Filters configuration
        filters: [],

        // Actions configuration
        actionHandlers: {
            delete: deleteEntity,
            toggleApertura: (entityType, id) => {
                const escuela = entities.find(e => e.id === id);
                if (escuela) {
                    toggleApertura(escuela);
                }
            }
        },
        showViewButton: false, // Users don't need a dedicated view page
        conditionalDelete: (user) => !user.is_system, // Prevent deletion of system users

        // Custom actions - Switch de apertura solo para fiscales generales
        customActions: isFiscalGeneral() ? [
            {
                action: 'toggleApertura',
                label: '',
                icon: '',
                class: '',
                condition: () => true, // Always show for fiscal general
                render: (entity) => (
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input ms-0"
                            type="checkbox"
                            role="switch"
                            id={`switch-escuela-${entity.id}`}
                            checked={entity.abierto || false}
                            onChange={() => toggleApertura(entity)}
                            title={entity.abierto ? 'Escuela abierta - Click para cerrar' : 'Escuela cerrada - Click para abrir'}
                        />
                        <label 
                            className="form-check-label" 
                            htmlFor={`switch-escuela-${entity.id}`}
                            style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                            {entity.abierto ? 'Abrió' : 'No Abrió'}
                        </label>
                    </div>
                )
            },
        ] : [],

        // Event handlers (standard for all entities)
        onSearch: handleSearchChange,
        onPageChange: handlePageChange,
        onSort: handleSortChange,
        onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
            load();
        },
        
        // Current state for sorting
        currentSortBy: currentSortBy,
        currentSortOrder: currentSortOrder,

        // Row styling based on fiscal completion percentage
        getRowStyle: getRowBackgroundColor,

        // Editor configuration (DynamicModal for Users)
        editorType: 'modal',
        editorConfig: {
            title: 'Escuela Editor',
            fields: [
                {
                    name: 'nombre',
                    label: 'Nombre',
                    type: 'text', 
                    required: true,
                    placeholder: 'Ingrese el nombre de la escuela'
                },
                {
                    name: 'calle',
                    label: 'Dirección',
                    type: 'text',
                    placeholder: 'Ingrese la dirección de la escuela'
                },
                {
                    name: 'abierto',
                    label: 'Abierto',
                    type: 'checkbox',
                    defaultValue: false,
                    placeholder: '¿La escuela está abierta?'
                }
            ],
            customValidation: () => {
                // Validation logic here if needed
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };

    const renderEscuelaInfo = () => {
        // Prepare mesas data with only fiscal de mesa (not general)
        const prepareTableData = () => {
            const mesasData = [];
            
            // Create a map of fiscales by mesa number for quick lookup
            const fiscalesByMesa = {};
            if (escuela.mesasConFiscal && escuela.mesasConFiscal.length > 0) {
                escuela.mesasConFiscal.forEach(item => {
                    const mesaNumero = item.mesa?.numero;
                    if (mesaNumero) {
                        if (!fiscalesByMesa[mesaNumero]) {
                            fiscalesByMesa[mesaNumero] = [];
                        }
                        fiscalesByMesa[mesaNumero].push({
                            user: item.user,
                            mesa: item.mesa,
                            type: 'mesa'
                        });
                    }
                });
            }
            
            // Process all mesas - only add fiscal de mesa, not general
            if (escuela.mesas && escuela.mesas.length > 0) {
                escuela.mesas.forEach(mesa => {
                    const mesaFiscales = fiscalesByMesa[mesa.numero] || [];
                    
                    mesasData.push({
                        ...mesa,
                        fiscales: mesaFiscales // Only fiscales de mesa
                    });
                });
            }
            
            return mesasData.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
        };
        
        const tableData = prepareTableData();
        
        return (
            <div className="escuela-info">
                
                
                {/* Fiscales Generales Table */}
                <div className="mb-5">
                    <h3>Fiscales Generales ({escuela.fiscalesGenerales?.length || 0})</h3>
                    <EntityTable
                        data={{ data: escuela.fiscalesGenerales || [] }}
                        config={{
                            columns: [
                                { 
                                    header: 'Nombre', 
                                    field: 'user.first_name', 
                                    type: 'text'
                                },
                                { 
                                    header: 'Apellido', 
                                    field: 'user.last_name', 
                                    type: 'text'
                                },
                                { 
                                    header: 'Teléfono', 
                                    field: 'user.telefono', 
                                    type: 'custom',
                                    render: (entity) => {
                                        if (!entity.user.telefono) {
                                            return <span className="text-muted">No disponible</span>;
                                        }
                                        
                                        const phoneNumber = entity.user.telefono.toString().replace(/[\s\-()]/g, '');
                                        return (
                                            <a 
                                                href={`https://wa.me/54${phoneNumber}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-success"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <i className="fab fa-whatsapp me-1"></i>
                                                {entity.user.telefono}
                                            </a>
                                        );
                                    }
                                },
                                { 
                                    header: 'Acciones', 
                                    field: 'actions', 
                                    type: 'custom',
                                    render: (entity) => (
                                        <button 
                                            className="btn btn-sm btn-info"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFiscalClick(entity.user);
                                            }}
                                            title="Ver detalles del fiscal general"
                                        >
                                            <i className="fas fa-eye me-1"></i>
                                            Ver detalles
                                        </button>
                                    )
                                }
                            ]
                        }}
                        disableEdit={true}
                    />
                </div>
                
                {/* Mesas Table */}
                <div>
                    <h3>Mesas de la Escuela ({tableData.length})</h3>
                    <EntityTable
                        data={{ data: tableData }}
                        config={{
                            columns: [
                                { 
                                    header: 'Número', 
                                    field: 'numero', 
                                    type: 'custom',
                                    render: (entity) => (
                                        <strong className="text-primary">
                                            Mesa #{entity.numero}
                                        </strong>
                                    )
                                },
                                { 
                                    header: 'Abrió', 
                                    field: 'mesa_abrio', 
                                    type: 'custom',
                                    render: (entity) => (
                                        <span className={`badge ${entity.mesa_abrio ? 'bg-success' : 'bg-danger'}`}>
                                            <i className={`fas ${entity.mesa_abrio ? 'fa-check' : 'fa-times'} me-1`}></i>
                                            {entity.mesa_abrio ? 'Sí' : 'No'}
                                        </span>
                                    )
                                },
                                { 
                                    header: 'Fiscales de Mesa', 
                                    field: 'fiscales', 
                                    type: 'custom',
                                    render: (entity) => {
                                        if (!entity.fiscales || entity.fiscales.length === 0) {
                                            return <span className="text-muted">Sin fiscal asignado</span>;
                                        }
                                        
                                        return (
                                            <div className="d-flex flex-wrap gap-1">
                                                {entity.fiscales.map((fiscal, index) => (
                                                    <div key={index} className="position-relative d-inline-block">
                                                        <span
                                                            className="badge bg-primary clickable-tag pe-4"
                                                            style={{ cursor: 'pointer', paddingRight: '30px !important' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFiscalClick(fiscal.user, fiscal.mesa);
                                                            }}
                                                            title="Click para ver detalles del fiscal de mesa"
                                                        >
                                                            <i className="fas fa-user me-1"></i>
                                                            {fiscal.user.first_name} {fiscal.user.last_name}
                                                        </span>
                                                        <button
                                                            className="btn btn-sm position-absolute"
                                                            style={{
                                                                top: '0',
                                                                right: '0',
                                                                padding: '0',
                                                                width: '20px',
                                                                height: '100%',
                                                                background: 'rgba(255, 255, 255, 0.2)',
                                                                border: 'none',
                                                                color: 'white',
                                                                borderRadius: '0 4px 4px 0',
                                                                fontSize: '10px'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFiscalAssignment(fiscal.user.id, entity.id);
                                                            }}
                                                            title="Eliminar asignación del fiscal"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                }
                            ]
                        }}
                        disableEdit={true}
                    />
                </div>
            </div>
        );
    };
    
    return (
        <div className="content-section">
            <div className="content-header d-flex justify-content-between align-items-center">
                <div>
                    <h1>
                        <i className="fas fa-map-marker-alt me-2"></i>
                        {escuela ? `Escuela: ${escuela.nombre}` : 'Escuelas'}
                    </h1>
                    <p>{escuela ? `Dirección: ${escuela.calle} / Circuito: ${escuela.circuito.nombre} / Localidad: ${escuela.circuito.localidad.nombre}` : 'Gestiona las escuelas y sus fiscales'}</p>
                </div>
                {getAvailableRolesForCurrentUser().length > 0 ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={handleAddCollaborator}
                        disabled={loading}
                    >
                        <i className="fas fa-plus me-2"></i>Agregar Colaborador
                    </button>
                ) : (
                    <div className="text-muted">
                    </div>
                )}
            </div>

            <div className="row">
                <div className="col-12">
                    {
                        escuela && (
                            <div className="right" style={{ marginBottom: '30px' }}>
                                <button className="btn btn-primary" onClick={() => setEscuela(null)}>
                                    <i className="fas fa-arrow-left"></i> Volver a la lista de escuelas
                                </button>
                            </div>
                        )
                    }
                    <div className="card">
                        <div className="card-body">
                            {
                                escuela ? (
                                    renderEscuelaInfo()
                                ) : (
                                    <EntityTable
                                        ref={tableRef}
                                        data={{ data: entities, pagination }}
                                        config={tableConfig}
                                        loading={loading}
                                        checkPermissions={checkEscuelaPermissions}
                                        checkCustomActionPermissions={checkCustomActionPermissions}
                                        onPageChange={handlePageChange}
                                        onSearchChange={handleSearchChange}
                                        onClick={handleClick}
                                    />
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de información del fiscal */}
            {showFiscalModal && selectedFiscal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-backdrop fade show" onClick={closeFiscalModal}></div>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-user me-2"></i>
                                    Información del Fiscal
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={closeFiscalModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card mb-3">
                                            <div className="card-header">
                                                <h6 className="mb-0">
                                                    <i className="fas fa-id-card me-2"></i>
                                                    Datos Personales
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-2">
                                                    <strong>Nombre Completo:</strong>
                                                    <div>{selectedFiscal.first_name} {selectedFiscal.last_name}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>DNI:</strong>
                                                    <div>{selectedFiscal.dni || 'No disponible'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Email:</strong>
                                                    <div>{selectedFiscal.email || 'No disponible'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Teléfono:</strong>
                                                    <div>
                                                        {selectedFiscal.telefono ? (
                                                            <a 
                                                                href={`https://wa.me/54${selectedFiscal.telefono.toString().replace(/[\s\-()]/g, '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-success"
                                                            >
                                                                <i className="fab fa-whatsapp me-1"></i>
                                                                {selectedFiscal.telefono}
                                                            </a>
                                                        ) : (
                                                            'No disponible'
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Dirección:</strong>
                                                    <div>{selectedFiscal.direccion || 'No disponible'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card mb-3">
                                            <div className="card-header">
                                                <h6 className="mb-0">
                                                    <i className="fas fa-school me-2"></i>
                                                    Información Electoral
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-2">
                                                    <strong>Escuela:</strong>
                                                    <div>{escuela ? escuela.nombre : 'No disponible'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Dirección de Escuela:</strong>
                                                    <div>{escuela ? escuela.calle : 'No disponible'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Circuito:</strong>
                                                    <div>{escuela?.circuito?.nombre || 'No disponible'}</div>
                                                </div>
                                                {selectedFiscal.mesa && (
                                                    <div className="mb-2">
                                                        <strong>Mesa Asignada:</strong>
                                                        <div>
                                                            <span className="badge bg-info">
                                                                Mesa #{selectedFiscal.mesa.numero}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mb-2">
                                                    <strong>Tipo de Fiscal:</strong>
                                                    <div>
                                                        {selectedFiscal.mesa ? (
                                                            <span className="badge bg-primary">Fiscal de Mesa</span>
                                                        ) : (
                                                            <span className="badge bg-success">Fiscal General</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {/* Botón eliminar asignación - solo para fiscales de mesa */}
                                {selectedFiscal.mesa && (
                                    <button 
                                        type="button" 
                                        className="btn btn-danger me-2" 
                                        onClick={() => {
                                            closeFiscalModal();
                                            // Ensure we use the same parameter structure as the badges
                                            const userId = selectedFiscal.id || selectedFiscal.user_id;
                                            const mesaId = selectedFiscal.mesa ? selectedFiscal.mesa.id : null;
                                            if (mesaId) {
                                                removeFiscalAssignment(userId, mesaId);
                                            }
                                        }}
                                        title="Eliminar asignación del fiscal de mesa"
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Eliminar Asignación
                                    </button>
                                )}
                                
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={closeFiscalModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar colaborador */}
            <DynamicModal
                isOpen={showAddCollaboratorModal}
                onClose={handleCloseModal}
                onSave={handleSaveCollaborator}
                data={null}
                config={{
                    title: 'Agregar Colaborador',
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
                        { 
                            name: 'role_id', 
                            label: 'Rol', 
                            type: 'select',
                            required: true,
                            options: getAvailableRolesForCurrentUser().map(role => ({
                                value: role.id,
                                label: role.display_name || role.name
                            })),
                            placeholder: getAvailableRolesForCurrentUser().length > 0 ? 'Seleccione el rol' : 'No hay roles disponibles',
                            disabled: getAvailableRolesForCurrentUser().length === 0
                        },
                        // Campo nivel de acceso
                        {
                            name: 'access_levels',
                            label: 'Asignaciones',
                            type: 'custom',
                            required: false,
                            helpText: 'Selecciona las asignaciones que tendrá este usuario',
                            render: (value, onChange, formData) => {
                                // Get the selected role dynamically based on role_id
                                const roleId = formData?.role_id;
                                const selectedRole = roleId ? 
                                    getAvailableRolesForCurrentUser().find(role => role.id === parseInt(roleId)) : 
                                    null;

                                return (
                                    <AccessLevelSelector
                                        value={value}
                                        onChange={onChange}
                                        userRole={userData?.role}
                                        currentUserAccess={currentUserAccess}
                                        selectedRole={selectedRole}
                                        disabled={savingCollaborator}
                                        escuelaFilter={escuela ? escuela.id : null}
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

                        // Validate role is selected
                        if (!formData.role_id) {
                            errors.role_id = 'Debe seleccionar un rol';
                        }

                        return errors;
                    }
                }}
                loading={savingCollaborator}
            />

        </div>
    );
}

export default Escuela;