import React, { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import mesaService from '../../../services/mesaService';
import ContentHeader from '../../../components/ContentHeader';
import PhotoUpload from '../../../components/PhotoUpload';
import Swal from 'sweetalert2';

const Mesa = () => {
    const [entities, setEntities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [photoUploadType, setPhotoUploadType] = useState(null); // 'acta' o 'certificado'
    const [selectedMesaForUpload, setSelectedMesaForUpload] = useState(null);
    const tableRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    page: currentPage,
                    limit: pageSize,
                    search: currentSearch,
                    filters: currentFilters,
                };
                const response = await mesaService.get(params);
                setEntities(response.data);
                setPagination(response.pagination);
            } catch (error) {
                console.error('Error loading mesa:', error);
            } finally {
                setLoading(false);
            }
        };

        load();
        loadCurrentUser(); // Load current user for permissions
    }, [currentPage, pageSize, currentSearch, currentFilters]);

    const load = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: pageSize,
                search: currentSearch,
                filters: currentFilters,
            };
            const response = await mesaService.get(params);
            setEntities(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error loading mesa:', error);
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
            const response = await mesaService.getById(id);
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
            const response = await mesaService.delete(id);
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
                response = await mesaService.update(id, data);
            } else {
                response = await mesaService.create(data);
            }

            if (response.success) {
                // Refresh table after save
                await load(currentPage, pageSize, currentSearch, currentFilters);
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to save mesa');
            }
        } catch (error) {
            console.error('Error saving mesa:', error);
            throw error;
        }
    };

    // Load current user for permissions check
    const loadCurrentUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCurrentUser(data.user);
                }
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    // Toggle apertura state for mesa
    const toggleApertura = async (mesa) => {
        try {
            const newState = !mesa.mesa_abrio;
            console.log(`Toggling mesa ${mesa.id} apertura to:`, newState);
            
            const response = await mesaService.update(mesa.id, {
                ...mesa,
                mesa_abrio: newState
            });

            if (response.success) {
                // Update local state immediately for better UX
                setEntities(prevEntities => 
                    prevEntities.map(entity => 
                        entity.id === mesa.id 
                            ? { ...entity, mesa_abrio: newState }
                            : entity
                    )
                );
                
                console.log(`Mesa ${mesa.numero} ${newState ? 'abrió' : 'cerró'} exitosamente`);
            } else {
                throw new Error(response.error || 'Failed to update mesa apertura');
            }
        } catch (error) {
            console.error('Error toggling mesa apertura:', error);
            alert('Error al actualizar el estado de apertura: ' + error.message);
        }
    };

    // Check if current user is fiscal general
    const isFiscalGeneral = () => {
        return currentUser?.role?.name === 'fiscal_general';
    };

    // Custom permission check for EntityTable - solo admin para botones estándar
    const checkMesaPermissions = (user) => {
        // Solo admin puede ver botones estándar (edit, delete)
        return user?.role?.name === 'admin';
    };

    // Permission check específico para custom actions (fiscal_general)
    const checkCustomActionPermissions = (user) => {
        // Fiscal general puede ver custom actions (switch)
        return user?.role?.name === 'fiscal_general';
    };

    // Funciones para manejar subida de fotos de escrutinio
    const handleEscrutinioUpload = (tipo, mesa) => {
        setPhotoUploadType(tipo);
        setSelectedMesaForUpload(mesa);
        setShowPhotoUpload(true);
    };

    const handlePhotoUploadSuccess = async (uploadedFiles) => {
        console.log('Fotos subidas exitosamente:', uploadedFiles);
        
        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Foto Subida!',
            text: `Foto de ${photoUploadType === 'acta' ? 'Acta de Escrutinio' : 'Certificado de Escrutinio'} subida exitosamente`,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745',
            timer: 3000,
            timerProgressBar: true
        });

        // Refrescar datos de la tabla para mostrar los nuevos badges
        await load();

        // Cerrar modal
        setShowPhotoUpload(false);
        setPhotoUploadType(null);
        setSelectedMesaForUpload(null);
    };

    const handlePhotoUploadClose = () => {
        setShowPhotoUpload(false);
        setPhotoUploadType(null);
        setSelectedMesaForUpload(null);
    };

    const tableConfig = {
        // Basic configuration
        tableId: 'mesas-table',
        entityType: 'mesa',
        emptyMessage: 'No mesas found. Create your first mesa to get started!',
        enableSearch: true,

        // Columns configuration
        columns: [
            {
                header: 'Número',
                field: 'numero',
                type: 'link',
                linkUrl: '/admin/ciudadanos',
                queryParams: {
                    mesa: '{numero}'
                },
                linkTitle: 'Ver ciudadanos de esta mesa',
                linkClass: 'text-primary text-decoration-none fw-bold fs-5'
            },
            {
                header: 'Escrutinio',
                field: 'escrutinio',
                type: 'custom',
                render: (entity) => {
                    const hasActa = entity.acta_de_escrutinio && entity.acta_de_escrutinio.trim();
                    const hasCert = entity.certificado_de_escrutinio && entity.certificado_de_escrutinio.trim();
                    
                    return (
                        <div className="d-flex flex-wrap gap-1">
                            {hasActa ? (
                                <span 
                                    className="badge bg-success"
                                    title="Acta de Escrutinio: Foto subida"
                                >
                                    <i className="fas fa-file-image me-1"></i>
                                    A. Escrutinio
                                </span>
                            ) : (
                                <span className="badge bg-secondary">
                                    <i className="fas fa-file-image me-1"></i>
                                    A. Escrutinio
                                </span>
                            )}
                            
                            {hasCert ? (
                                <span 
                                    className="badge bg-info"
                                    title="Certificado de Escrutinio: Foto subida"
                                >
                                    <i className="fas fa-certificate me-1"></i>
                                    C. Escrutinio
                                </span>
                            ) : (
                                <span className="badge bg-secondary">
                                    <i className="fas fa-certificate me-1"></i>
                                    C. Escrutinio
                                </span>
                            )}
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
                const mesa = entities.find(e => e.id === id);
                if (mesa) {
                    toggleApertura(mesa);
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
                            id={`switch-${entity.id}`}
                            checked={entity.mesa_abrio || false}
                            onChange={() => toggleApertura(entity)}
                            title={entity.mesa_abrio ? 'Mesa abierta - Click para cerrar' : 'Mesa cerrada - Click para abrir'}
                        />
                        <label 
                            className="form-check-label" 
                            htmlFor={`switch-${entity.id}`}
                            style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                            {entity.mesa_abrio ? 'Abrió' : 'No Abrió'}
                        </label>
                    </div>
                )
            },
            {
                action: 'actaEscrutinio',
                label: 'A. Escrutinio',
                icon: 'fas fa-file-image',
                class: 'btn-outline-success',
                condition: () => true,
                render: (entity) => (
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEscrutinioUpload('acta', entity);
                        }}
                        title="Subir fotos de Acta de Escrutinio"
                    >
                        <i className="fas fa-file-image me-1"></i>
                        A. Escrutinio
                    </button>
                )
            },
            {
                action: 'certificadoEscrutinio',
                label: 'C. Escrutinio',
                icon: 'fas fa-certificate',
                class: 'btn-outline-info',
                condition: () => true,
                render: (entity) => (
                    <button
                        className="btn btn-sm btn-outline-info"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEscrutinioUpload('certificado', entity);
                        }}
                        title="Subir fotos de Certificado de Escrutinio"
                    >
                        <i className="fas fa-certificate me-1"></i>
                        C. Escrutinio
                    </button>
                )
            }
        ] : [],

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration (DynamicModal for Users)
        editorType: 'modal',
        editorConfig: {
            title: 'Mesa Editor',
            fields: [
                {
                    name: 'numero',
                    label: 'Número de Mesa',
                    type: 'text', 
                    required: true,
                    placeholder: 'Ingrese el número de la mesa'
                },
                {
                    name: 'mesa_testigo',
                    label: 'Mesa Testigo',
                    type: 'checkbox',
                    defaultValue: false,
                    placeholder: '¿Es una mesa testigo?'
                },
                {
                    name: 'mesa_extranjeros',
                    label: 'Mesa Extranjeros',
                    type: 'checkbox',
                    defaultValue: false,
                    placeholder: '¿Es una mesa para extranjeros?'
                },
                {
                    name: 'mesa_abrio',
                    label: 'Mesa Abrió',
                    type: 'checkbox',
                    defaultValue: false,
                    placeholder: '¿La mesa ya abrió?'
                },
            ],
            customValidation: () => {
                // Add validation logic here if needed
                return {};
            }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };
    
    return (
        <div className="content-section">
            <ContentHeader
                icon='fas fa-map-marker-alt'
                title='Mesa'
                description='Manage mesas'
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
                                checkPermissions={checkMesaPermissions}
                                checkCustomActionPermissions={checkCustomActionPermissions}
                                onPageChange={handlePageChange}
                                onSearchChange={handleSearchChange}
                                onFiltersChange={handleFiltersChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para subir fotos de escrutinio */}
            {showPhotoUpload && (
                <PhotoUpload
                    title={`Subir Foto de ${photoUploadType === 'acta' ? 'Acta de Escrutinio' : 'Certificado de Escrutinio'}`}
                    onUpload={handlePhotoUploadSuccess}
                    onClose={handlePhotoUploadClose}
                    maxFiles={1}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                    maxSizeMB={10}
                    folder="escrutinio"
                    mesaId={selectedMesaForUpload?.id}
                    tipoDocumento={photoUploadType}
                />
            )}
        </div>
    );
}

export default Mesa;