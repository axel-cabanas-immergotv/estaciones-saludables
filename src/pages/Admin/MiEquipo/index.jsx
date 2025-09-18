import React, { useState, useEffect } from 'react';
import OrgChart from '../../../components/OrgChart';
import UserAccessLevels from '../../../components/UserAccessLevels';
import DynamicModal from '../../../components/DynamicModal';
import AccessLevelSelector from '../../../components/AccessLevelSelector';
import { useAffiliateId } from '../../../hooks/useAffiliateId';
import usersService from '../../../services/usersService';
import Swal from 'sweetalert2';
import './MiEquipo.css';
import ContentHeader from '../../../components/ContentHeader';

const MiEquipo = () => {
    const [userData, setUserData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [savingCollaborator, setSavingCollaborator] = useState(false);
    const [selectedAccessLevels, setSelectedAccessLevels] = useState([]);
    const [currentUserAccess, setCurrentUserAccess] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const affiliateId = useAffiliateId();

    useEffect(() => {
        loadUserData();
        loadTeamData();
        loadAvailableRoles();
        loadMetrics();
    }, [affiliateId]);

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

    const loadTeamData = async () => {
        try {
            setLoading(true);
            
            // Build URL with affiliate_id parameter
            const url = new URL('/api/admin/users/my-team', window.location.origin);
            if (affiliateId) {
                url.searchParams.append('affiliate_id', affiliateId);
            }
            
            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTeamData(data.data);
                } else {
                    setError(data.message || 'Error al cargar datos del equipo');
                }
            } else {
                setError('Error al cargar datos del equipo');
            }
        } catch (error) {
            console.error('Error loading team data:', error);
            setError('Error de conexión al cargar datos del equipo');
        } finally {
            setLoading(false);
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

    const loadMetrics = async () => {
        try {
            setLoadingMetrics(true);
            const response = await fetch('/api/admin/bi', {
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMetrics(data.data);
                }
            } else {
                console.error('Error response:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        } finally {
            setLoadingMetrics(false);
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
                
                // Close modal and refresh team data
                setShowAddCollaboratorModal(false);
                setSelectedAccessLevels([]);
                await loadTeamData();
                
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
        setSelectedAccessLevels([]);
    };

    const createHierarchyData = () => {
        if (!teamData) return null;

        const currentUser = teamData.currentUser;
        if (!currentUser) return null;

        // Helper function to create safe node data
        const createSafeNodeData = (user, nodeType) => {
            if (!user) return null;

            const userId = user.id;
            const firstName = user.first_name || user.firstName || '';
            const lastName = user.last_name || user.lastName || '';
            const userRole = user.role;

            if (!userId) return null;

            const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuario Sin Nombre';
            const roleDisplay = userRole?.display_name || userRole?.name || 'Sin Rol';
            
            let assignment = '';
            try {
                assignment = getUserAssignmentText(user) || '';
            } catch (error) {
                console.warn(`Error getting assignment for ${nodeType}:`, error);
                assignment = '';
            }

            const nodeData = {
                id: `user_${userId}`,
                name: displayName,
                role: roleDisplay,
                nodeType: nodeType,
                assignment: assignment,
                userId: userId,
                children: [],
                loaded: false,
                hasUnloadedChildren: nodeType !== 'superior'
            };

            return nodeData;
        };

        // Create the hierarchy structure
        let rootNode;
        let currentNode;

        if (teamData.superiors && teamData.superiors.length > 0) {
            // If there are superiors, create a proper hierarchy
            // Find the highest level superior (usually only one in our case)
            const highestSuperior = teamData.superiors[0];
            rootNode = createSafeNodeData(highestSuperior, 'superior');
            
            if (rootNode) {
                // Current user is child of the superior
                currentNode = createSafeNodeData(currentUser, 'current');
                if (currentNode) {
                    rootNode.children.push(currentNode);
                }
            }
        } else {
            // No superiors, current user is the root
            rootNode = createSafeNodeData(currentUser, 'current');
            currentNode = rootNode;
        }

        if (!rootNode) return null;

        // Add siblings at the same level as current user
        if (teamData.siblings && Array.isArray(teamData.siblings)) {
            teamData.siblings.forEach(sibling => {
                const siblingNode = createSafeNodeData(sibling, 'sibling');
                if (siblingNode && sibling.id !== currentUser.id) {
                    // Add siblings as children of the same parent (superior or root)
                    if (rootNode !== currentNode) {
                        // If there's a superior, add siblings to the superior
                        rootNode.children.push(siblingNode);
                    } else {
                        // If current user is root, add siblings as direct children
                        rootNode.children.push(siblingNode);
                    }
                }
            });
        }

        // Add subordinates as children of current user
        if (teamData.subordinates && Array.isArray(teamData.subordinates) && currentNode) {
            teamData.subordinates.forEach(subordinate => {
                const subordinateNode = createSafeNodeData(subordinate, 'subordinate');
                if (subordinateNode) {
                    // Add subordinates as children of current user
                    currentNode.children.push(subordinateNode);
                }
            });
            
            // Mark current user as having loaded initial children
            if (teamData.subordinates.length > 0) {
                currentNode.loaded = true;
            }
        }

        return rootNode;
    };

    const getUserAssignmentText = (user) => {
        if (!user.access_assignments || user.access_assignments.length === 0) {
            return '';
        }

        // Get the first assignment (users typically have one primary assignment)
        const assignment = user.access_assignments[0];
        
        if (assignment.mesa) {
            return `Mesa ${assignment.mesa.numero} | ${assignment.mesa.escuela.nombre}`;
        } else if (assignment.escuela) {
            return assignment.escuela.nombre;
        } else if (assignment.circuito) {
            return assignment.circuito.nombre;
        } else if (assignment.localidad) {
            return assignment.localidad.nombre;
        }
        return '';
    };

    if (loading) {
        return (
            <div className="content-section">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content-section">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                    <button 
                        className="btn btn-outline-danger btn-sm ms-3"
                        onClick={loadTeamData}
                    >
                        <i className="fas fa-redo me-1"></i>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const hierarchyData = createHierarchyData();

    return (
        <div className="content-section">
            <div className="content-header d-flex justify-content-between align-items-center">
                <div>
                    <h1>
                        <i className="fas fa-users me-2"></i>
                        Mi Equipo
                    </h1>
                    <p>Gestiona tu equipo y visualiza la estructura organizacional</p>
                </div>
                {getAvailableRolesForCurrentUser().length > 0 ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {}}
                        disabled={loading}
                    >
                        <i className="fas fa-plus me-2"></i>Agregar Usuario
                    </button>
                ) : (
                    <div className="text-muted">
                    </div>
                )}
            </div>

            <div className="row">
                {/* Panel izquierdo - Datos del usuario */}
                <div className="col-lg-4 col-md-12 mb-4">
                    <div className="user-profile-card">
                        <div className="user-profile-header">
                            <div className="user-avatar">
                                {userData?.profile_image ? (
                                    <img 
                                        src={userData.profile_image} 
                                        alt="Foto de perfil"
                                        className="avatar-image"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <i className="fas fa-user"></i>
                                    </div>
                                )}
                            </div>
                            <div className="user-info">
                                <h3 className="user-name">
                                    {userData?.first_name?.charAt(0).toUpperCase() + userData?.first_name?.slice(1)} {userData?.last_name?.charAt(0).toUpperCase() + userData?.last_name?.slice(1)}
                                </h3>
                                <p className="user-role">
                                    {userData?.role?.display_name || userData?.role?.name || 'Sin rol asignado'}
                                </p>
 
                                
                                <p><i class="fa-brands fa-whatsapp"></i>   {userData?.telefono}</p> 
                        

                            </div>
                        </div>

                        {/* Sección del Coordinador - dentro de la misma card */}
                        {userData?.creator && (
                            <div className="coordinator-section">
                                <div className="coordinator-header-enhanced">
                                    <div className="coordinator-icon">
                                        <i className="fas fa-user-crown"></i>
                                    </div>
                                    <h4 className="coordinator-title">Mi Coordinador</h4>
                                </div>
                                
                                <div className="coordinator-profile">
                                    <div className="coordinator-avatar">
                                        <i className="fas fa-user-tie"></i>
                                    </div>
                                    
                                    <div className="coordinator-details">
                                        <div className="coordinator-name-enhanced">
                                            {userData.creator.first_name?.charAt(0).toUpperCase() + userData.creator.first_name?.slice(1)} {userData.creator.last_name?.charAt(0).toUpperCase() + userData.creator.last_name?.slice(1)}
                                        </div>
                                        
                                        <div className="coordinator-role-enhanced">
                                            <i className="fas fa-shield-alt me-2"></i>
                                            {userData.creator.role?.display_name || userData.creator.role?.name || 'Sin rol'}
                                        </div>
                                        
                                        {/* Contact Information */}
                                        <div className="coordinator-contact-enhanced">
                                            {userData.creator.email && (
                                                <div className="contact-email">
                                                    <i className="fas fa-envelope me-2"></i>
                                                    <span>{userData.creator.email}</span>
                                                </div>
                                            )}
                                            
                                            {userData.creator.telefono && (
                                                <div className="contact-whatsapp">
                                                    <a 
                                                        href={`https://wa.me/${userData.creator.telefono}`}
                                                        className="whatsapp-button-enhanced"
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        title="Contactar por WhatsApp"
                                                    >
                                                        <div className="whatsapp-icon">
                                                            <i className="fab fa-whatsapp"></i>
                                                        </div>
                                                        <div className="whatsapp-text">
                                                            <span className="whatsapp-label">WhatsApp</span>
                                                            <span className="whatsapp-number">{userData.creator.telefono}</span>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel derecho - Organigrama */}
                <div className="col-lg-8 col-md-12">
                    <div className="org-chart-card">                        
                        <div className="org-chart-body">
                            {hierarchyData ? (
                                <OrgChart 
                                    data={hierarchyData}
                                    width={800}
                                    height={600}
                                />
                            ) : (
                                <div className="no-team-data">
                                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                    <h5>No hay datos del equipo disponibles</h5>
                                    <p className="text-muted">
                                        No se pudieron cargar los datos de la estructura del equipo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paneles de Métricas */}
            {/* <div className="row mt-4">
                <div className="col-12">
                    <h3 className="metrics-title mb-4">
                        <i className="fas fa-chart-bar me-2"></i>
                        Métricas de Mi Nivel de Acceso
                    </h3>
                </div>
                
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="metric-card total-schools">
                        <div className="metric-icon">
                            <i className="fas fa-school"></i>
                        </div>
                        <div className="metric-content">
                            <h4 className="metric-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.escuelas?.total || 0
                                )}
                            </h4>
                            <p className="metric-label">Total de Escuelas</p>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="metric-card with-fiscal-general">
                        <div className="metric-icon">
                            <i className="fas fa-user-check"></i>
                        </div>
                        <div className="metric-content">
                            <h4 className="metric-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.escuelas?.conFiscalGeneral || 0
                                )}
                            </h4>
                            <p className="metric-label">Con Fiscal General</p>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="metric-card total-mesas">
                        <div className="metric-icon">
                            <i className="fas fa-table"></i>
                        </div>
                        <div className="metric-content">
                            <h4 className="metric-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.mesas?.total || 0
                                )}
                            </h4>
                            <p className="metric-label">Total de Mesas</p>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="metric-card with-fiscal-mesa">
                        <div className="metric-icon">
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <div className="metric-content">
                            <h4 className="metric-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.mesas?.conFiscalMesa || 0
                                )}
                            </h4>
                            <p className="metric-label">Con Fiscal de Mesa</p>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Paneles de Detalle */}
            {/* <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="metric-detail-card">
                        <div className="metric-detail-header">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            <h5 className="mb-0">Escuelas Sin Fiscal General</h5>
                        </div>
                        <div className="metric-detail-body">
                            <div className="metric-detail-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border text-warning" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.escuelas?.sinFiscalGeneral || 0
                                )}
                            </div>
                            <p className="metric-detail-description">
                                Escuelas que requieren asignación de fiscal general
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 mb-4">
                    <div className="metric-detail-card">
                        <div className="metric-detail-header">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            <h5 className="mb-0">Mesas Sin Fiscal de Mesa</h5>
                        </div>
                        <div className="metric-detail-body">
                            <div className="metric-detail-number">
                                {loadingMetrics ? (
                                    <div className="spinner-border text-warning" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                ) : (
                                    metrics?.mesas?.sinFiscalMesa || 0
                                )}
                            </div>
                            <p className="metric-detail-description">
                                Mesas que requieren asignación de fiscal de mesa
                            </p>
                        </div>
                    </div>
                </div>
            </div> */}

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
};

export default MiEquipo;
