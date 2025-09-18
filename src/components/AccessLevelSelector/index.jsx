import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SelectWrapper from '../SelectWrapper';
import './accessLevelSelector.css';

const AccessLevelSelector = ({ 
    value, 
    onChange, 
    userRole, 
    currentUserAccess, 
    selectedRole = null, // Rol seleccionado para el nuevo colaborador
    onReady = null, // Callback para notificar cuando el componente esté listo
    formData = null, // Datos del formulario (cuando se usa desde DynamicModal)
    disabled = false,
    escuelaFilter = null // ID de escuela para filtrar mesas (opcional)
}) => {
    // Debug: log the received value
    
    // Use ref to track if this is the first render
    const isFirstRender = useRef(true);
    
    // Use ref to store the latest onChange callback to avoid dependency issues
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Use ref to track previous role to prevent infinite loops
    const previousRoleId = useRef(null);

    // Map role IDs to role names (based on the options from Users page)
    const mapRoleIdToName = (roleId) => {
        const roleMap = {
            2: 'jefe_campana',
            3: 'responsable_localidad',
            4: 'responsable_seccion',
            5: 'responsable_circuito',
            6: 'fiscal_general',
            7: 'fiscal_mesa',
            8: 'logistica'
        };
        return roleMap[roleId] || null;
    };

    // Determine the selected role from props or formData
    const getSelectedRole = useMemo(() => {
        // If selectedRole prop is provided, use it
        if (selectedRole) {
            console.log('📝 AccessLevelSelector: Using selectedRole prop:', selectedRole);
            return selectedRole;
        }
        
        // If formData is available and has role_id, create role object
        if (formData && formData.role_id) {
            const roleName = mapRoleIdToName(formData.role_id);
            if (roleName) {
                const roleObj = {
                    id: formData.role_id,
                    name: roleName
                };
                console.log('📝 AccessLevelSelector: Using role from formData:', roleObj);
                return roleObj;
            }
        }
        
        console.log('📝 AccessLevelSelector: No role selected - formData:', formData);
        return null;
    }, [selectedRole, formData]);
    
    // Ensure value is always an array
    const initialValue = Array.isArray(value) ? value : [];
    const [selectedLevels, setSelectedLevels] = useState(initialValue);
    const [availableOptions, setAvailableOptions] = useState({
        localidades: [],
        circuitos: [],
        escuelas: [],
        mesas: []
    });
    const [loading, setLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Determine what levels the user can assign based on their role
    const getAssignableLevels = (roleName) => {
        if (!roleName) return [];
        
        switch (roleName.toLowerCase()) {
            case 'admin':
                // Admin can see all levels
                return ['localidades', 'circuitos', 'escuelas', 'mesas'];
            
            case 'responsable_localidad':
                // Responsable de Localidad: circuitos, escuelas, mesas
                return ['circuitos', 'escuelas', 'mesas'];
            
            case 'responsable_circuito':
                // Responsable de Circuito: escuelas, mesas
                return ['escuelas', 'mesas'];
            
            case 'fiscal_general':
                // Fiscal General: solo mesas
                return ['mesas'];
            
            case 'fiscal_mesa':
                // Fiscal de mesa: no puede crear usuarios, nunca llega aquí
                return [];
            
            case 'logistica':
                // Logística: no puede crear usuarios
                return [];
            
            default:
                // For any other role, no access by default
                return [];
        }
    };

    // Determine what levels should be shown based on the selected role for the new collaborator
    const getAccessLevelsForRole = (roleName) => {
        if (!roleName) return [];
        
        switch (roleName.toLowerCase()) {
            case 'fiscal_mesa':
                // Fiscal de Mesa: Solo Mesas
                return ['mesas'];
            
            case 'fiscal_general':
                // Fiscal General: Solo Escuelas
                return ['escuelas'];
            
            case 'jefe_campana':
                // Jefe de campaña: Localidades, Circuitos, Escuelas, Mesas
                return ['localidades', 'circuitos', 'escuelas', 'mesas'];
            
            case 'logistica':
                // Logística: Circuitos, Escuelas
                return ['circuitos', 'escuelas'];
            
            case 'responsable_circuito':
                // Responsable de Circuito: Circuitos, Escuelas
                return ['circuitos', 'escuelas'];
            
            case 'responsable_localidad':
                // Responsable de Localidad: Localidades, Circuitos, Escuelas
                return ['localidades', 'circuitos', 'escuelas'];
            
            case 'responsable_seccion':
                // Responsable de Sección: Circuitos, Escuelas
                return ['circuitos', 'escuelas'];
            
            default:
                // For any other role, no access by default
                return [];
        }
    };

    // Load available options based on current user's access
    const loadAvailableOptions = async () => {
        // No need to pre-load options - they will be loaded on-demand during search
        setLoading(false);
    };

    // Load default options (20 items) for a specific level type
    const loadDefaultOptions = useCallback(async (levelType) => {
        try {
            let defaultUrl;
            
            // Build URL for loading default 20 items
            switch (levelType) {
                case 'localidades':
                    defaultUrl = `/api/admin/localidades?limit=20`;
                    break;
                case 'circuitos':
                    defaultUrl = `/api/admin/circuitos?limit=20`;
                    break;
                case 'escuelas':
                    defaultUrl = `/api/admin/escuelas?limit=20`;
                    break;
                case 'mesas':
                    // Apply escuela filter if provided
                    if (escuelaFilter) {
                        defaultUrl = `/api/admin/mesas?limit=10000&escuela_id=${escuelaFilter}`;
                    } else {
                        defaultUrl = `/api/admin/mesas?limit=10000`;
                    }
                    break;
                default:
                    return;
            }

            const response = await fetch(defaultUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const formattedOptions = data.data.map(item => {
                        switch (levelType) {
                            case 'localidades':
                                return {
                                    value: item.id,
                                    label: item.nombre,
                                    parent_id: null
                                };
                            case 'circuitos':
                                return {
                                    value: item.id,
                                    label: item.nombre,
                                    parent_id: item.localidad_id
                                };
                            case 'escuelas': {
                                const escuelaLabel = `${item.nombre} | ${item.calle} | Circuito ${item.circuito.nombre}`;

                                return {
                                    value: item.id,
                                    label: escuelaLabel,
                                    parent_id: item.circuito_id
                                };
                            }
                            case 'mesas': {
                                let mesaLabel = item.numero;
                                if (item.user_assignments && item.user_assignments.length > 0) {
                                    const userNames = item.user_assignments.map(item => `${item.user.first_name} ${item.user.last_name}`).join(', ');
                                    mesaLabel = `${item.numero} | ${item.escuela.nombre} | ${userNames}`;
                                }
                                else{
                                    mesaLabel = `${item.numero} | ${item.escuela.nombre}`;
                                }

                                return {
                                    value: item.id,
                                    label: mesaLabel,
                                    parent_id: item.escuela_id
                                };
                            }
                            default:
                                return null;
                        }
                    }).filter(Boolean);

                    // Update available options for this level
                    setAvailableOptions(prev => ({
                        ...prev,
                        [levelType]: formattedOptions
                    }));

                    return formattedOptions;
                }
            }
        } catch (error) {
            console.error(`Error loading default ${levelType}:`, error);
        }
        return [];
    }, []);

    useEffect(() => {
        loadAvailableOptions();
    }, [currentUserAccess]);

    // Clear selected levels when the role changes
    useEffect(() => {
        const currentRoleId = getSelectedRole?.id;
        
        // Only clear if the role actually changed (and it's not the first render)
        if (currentRoleId && 
            previousRoleId.current !== null && 
            previousRoleId.current !== currentRoleId) {
            console.log('🔄 Role changed from', previousRoleId.current, 'to', currentRoleId, '- clearing levels');
            setSelectedLevels([]);
            onChangeRef.current && onChangeRef.current([]);
        }
        
        // Update previous role reference
        previousRoleId.current = currentRoleId;
    }, [getSelectedRole?.id]);

    // Notify parent when component is ready
    useEffect(() => {
        if (selectedRole && userRole && currentUserAccess && !isReady) {
            setIsReady(true);
            onReady && onReady();
        }
    }, [selectedRole, userRole, currentUserAccess, isReady, onReady]);

    // Improved useEffect for handling value changes
    useEffect(() => {
        // Only update if we have a selected role to avoid conflicts with role clearing
        if (getSelectedRole?.id) {
            // Ensure value is always an array when updating state
            if (Array.isArray(value)) {
                setSelectedLevels(value);
                
                // If this is not the first render and we have values, 
                // we need to ensure the availableOptions include these items
                if (!isFirstRender.current && value.length > 0) {
                    setAvailableOptions(prevOptions => {
                        const newAvailableOptions = { ...prevOptions };
                        
                        value.forEach(level => {
                            if (!newAvailableOptions[level.entity_type]) {
                                newAvailableOptions[level.entity_type] = [];
                            }
                            
                            const existingOption = newAvailableOptions[level.entity_type].find(opt => opt.value === level.entity_id);
                            if (!existingOption) {
                                newAvailableOptions[level.entity_type].push({
                                    value: level.entity_id,
                                    label: level.entity_name,
                                    parent_id: level.parent_id
                                });
                            }
                        });
                        
                        return newAvailableOptions;
                    });
                }
            } else {
                setSelectedLevels([]);
            }
        }
        
        // Mark that this is no longer the first render
        isFirstRender.current = false;
    }, [value, getSelectedRole?.id]); // Added getSelectedRole ID to dependencies to ensure proper updates

    // Get levels that should be shown based on the selected role for the new collaborator
    // and that the current user can assign based on their own role
    const userCanAssign = useMemo(() => getAssignableLevels(userRole?.name), [userRole?.name]);
    const roleRequiredLevels = useMemo(() => getAccessLevelsForRole(getSelectedRole?.name), [getSelectedRole?.name]);
    
    // Show intersection of what the user can assign and what the role requires
    const assignableLevels = useMemo(() => {
        return roleRequiredLevels.filter(level => userCanAssign.includes(level));
    }, [roleRequiredLevels, userCanAssign]);

    // Load default options for assignable levels when they change
    useEffect(() => {
        const loadDefaultOptionsForAssignableLevels = async () => {
            if (assignableLevels.length > 0 && getSelectedRole?.id) {
                // Load default options for each assignable level
                for (const levelType of assignableLevels) {
                    await loadDefaultOptions(levelType);
                }
            }
        };

        loadDefaultOptionsForAssignableLevels();
    }, [assignableLevels, getSelectedRole?.id, loadDefaultOptions]); // Dependencies on assignable levels and selected role ID

    // Remote search functions for each level using SelectWrapper's onInputChange
    const createSearchHandler = (levelType) => {
        return async (inputValue, { action }) => {
            // Handle input changes
            if (action === 'input-change') {
                // If input is empty or very short, load default options (20 items)
                if (!inputValue || inputValue.length === 0) {
                    await loadDefaultOptions(levelType);
                    return;
                }

                // If input has content, perform search
                if (inputValue.length >= 1) {
                    try {
                        let searchUrl;
                        
                        // Build search URL - the API will handle filtering based on user permissions
                        switch (levelType) {
                            case 'localidades':
                                searchUrl = `/api/admin/localidades?search=${encodeURIComponent(inputValue)}`;
                                break;
                            case 'circuitos':
                                searchUrl = `/api/admin/circuitos?search=${encodeURIComponent(inputValue)}`;
                                break;
                            case 'escuelas':
                                searchUrl = `/api/admin/escuelas?search=${encodeURIComponent(inputValue)}`;
                                break;
                            case 'mesas':
                                // Apply escuela filter if provided
                                if (escuelaFilter) {
                                    searchUrl = `/api/admin/mesas?search=${encodeURIComponent(inputValue)}&escuela_id=${escuelaFilter}`;
                                } else {
                                    searchUrl = `/api/admin/mesas?search=${encodeURIComponent(inputValue)}`;
                                }
                                break;
                            default:
                                return;
                        }

                        const response = await fetch(searchUrl);
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success) {
                                const formattedOptions = data.data.map(item => {
                                    switch (levelType) {
                                        case 'localidades':
                                            return {
                                                value: item.id,
                                                label: item.nombre,
                                                parent_id: null
                                            };
                                        case 'circuitos':
                                            return {
                                                value: item.id,
                                                label: item.nombre,
                                                parent_id: item.localidad_id
                                            };
                                        case 'escuelas': {
                                            const escuelaLabel = `${item.nombre} | ${item.calle} | Circuito ${item.circuito?.nombre ?? ''}`;

                                            return {
                                                value: item.id,
                                                label: escuelaLabel,
                                                parent_id: item.circuito_id
                                            };
                                        }
                                        case 'mesas': {
                                            let mesaLabel = item.numero;
                                            if (item.user_assignments && item.user_assignments.length > 0) {
                                                const userNames = item.user_assignments.map(item => `${item.user.first_name} ${item.user.last_name}`).join(', ');
                                                mesaLabel = `${item.numero} | ${userNames}`;
                                            }
                                            else{
                                                mesaLabel = `${item.numero} | ${item.escuela.nombre}`;
                                            }

                                            return {
                                                value: item.id,
                                                label: mesaLabel,
                                                parent_id: item.escuela_id
                                            };
                                        }
                                        default:
                                            return null;
                                    }
                                }).filter(Boolean);

                                // Update available options for this level
                                setAvailableOptions(prev => ({
                                    ...prev,
                                    [levelType]: formattedOptions
                                }));
                            }
                        }
                    } catch (error) {
                        console.error(`Error searching ${levelType}:`, error);
                    }
                }
            }
        };
    };

    // Function removed: createLoadAllHandler (no longer needed)

    const handleLevelChange = (levelType, selectedOptions) => {
        // Ensure selectedLevels is always an array
        const currentLevels = Array.isArray(selectedLevels) ? selectedLevels : [];
        const newSelectedLevels = currentLevels.filter(level => level.entity_type !== levelType);
        
        if (selectedOptions && selectedOptions.length > 0) {
            selectedOptions.forEach(option => {
                newSelectedLevels.push({
                    entity_type: levelType,
                    entity_id: option.value,
                    entity_name: option.label,
                    parent_id: option.parent_id
                });
            });
        }
        
        setSelectedLevels(newSelectedLevels);
        onChangeRef.current && onChangeRef.current(newSelectedLevels);
    };

    // Removed unused function removeLevel

    const renderLevelSelector = (levelType, levelLabel) => {
        if (!assignableLevels.includes(levelType)) {
            return null;
        }

        const options = availableOptions[levelType] || [];
        
        // Ensure selectedLevels is always an array
        const currentLevels = Array.isArray(selectedLevels) ? selectedLevels : [];
        const selectedItems = currentLevels
            .filter(level => level.entity_type === levelType)
            .map(level => {
                // For selected items, create option objects if they don't exist in availableOptions
                const entity = (availableOptions[levelType] || []).find(opt => opt.value === level.entity_id);
                return entity || {
                    value: level.entity_id,
                    label: level.entity_name,
                    parent_id: level.parent_id
                };
            });

        // All levels are now searchable and mesas use single selection
        let isMulti = levelType !== 'mesas' &&  levelType !== 'escuelas' ;

        if(levelType == 'escuelas' && getSelectedRole.name != 'fiscal_general'){
            isMulti = true;
        }

    
        const isSearchable = true; // All levels are now searchable

        return (
            <div className="access-level-selector__level" key={levelType}>
                <label className="access-level-selector__label">
                    {levelLabel}
                </label>
                <SelectWrapper
                    options={options}
                    value={selectedItems}
                    onChange={(selectedOptions) => {
                        if (Array.isArray(selectedOptions)) {
                            handleLevelChange(levelType, selectedOptions);
                        } else if (selectedOptions) {
                            handleLevelChange(levelType, [selectedOptions]);
                        } else {
                            handleLevelChange(levelType, []);
                        }
                    }}
                    placeholder={`Seleccionar ${levelLabel.toLowerCase()}...`}
                    isDisabled={disabled}
                    isLoading={loading}
                    isMulti={isMulti}
                    isSearchable={isSearchable}
                    noOptionsMessage={`Escribe para buscar ${levelLabel.toLowerCase()} disponibles`}
                    className="access-level-selector__select-wrapper"
                    onInputChange={createSearchHandler(levelType)}
                    helpText={`Escribe para buscar ${levelLabel.toLowerCase()} disponibles, o deja vacío para ver las primeras 20 opciones`}
                />
            </div>
        );
    };


    // Don't show anything if no role is selected
    if (!getSelectedRole) {
        return (
            <div className="access-level-selector">
                <div className="access-level-selector__no-role">
                    <i className="fas fa-info-circle me-2"></i>
                    Selecciona un rol para asignar
                </div>
            </div>
        );
    }

    // Show message if role is selected but no access levels are available
    if (assignableLevels.length === 0) {
        return (
            <div className="access-level-selector">
                <div className="access-level-selector__no-access">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No puedes asignar niveles de acceso para este rol, o tu rol actual no lo permite
                </div>
            </div>
        );
    }



    return (
        <div className="access-level-selector">
            <h4>Asignaciones</h4>
            <p className="access-level-selector__help">
                Selecciona la asignación que tendrá este usuario. 
                Solo puedes asignar niveles que estén dentro de tu área de responsabilidad según tu rol.
            </p>
            
            {renderLevelSelector('localidades', 'Localidades')}
            {renderLevelSelector('circuitos', 'Circuitos')}
            {renderLevelSelector('escuelas', 'Escuelas')}
            {renderLevelSelector('mesas', 'Mesas')}

        </div>
    );
};

export default AccessLevelSelector;
