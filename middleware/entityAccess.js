const { UserAccess, Localidad, Circuito, Escuela, Mesa, Seccion } = require('../models');
const { Op } = require('sequelize');

/**
 * Middleware to filter entities based on user access levels with hierarchical propagation
 * This ensures users can only see entities they have permission to access,
 * considering that access to higher levels grants access to all lower levels
 * 
 * Hierarchy: Seccion -> Localidad -> Circuito -> Escuela -> Mesa
 */
const filterEntitiesByUserAccess = (entityType) => {
    return async (req, res, next) => {
        try {
            // If user is admin, skip filtering (admin can see everything)
            if (req.user.role.name === 'admin') {
                return next();
            }

            // Get user's access levels
            const userAccess = await UserAccess.findAll({
                where: { 
                    user_id: req.user.id,
                    status: 'active'
                }
            });

            // If user has no access levels, they can't see any entities
            if (userAccess.length === 0) {
                req.userAccessFilter = { id: null }; // This will return no results
                return next();
            }

            // Build filter based on entity type and user access with hierarchical propagation
            let filterCondition = {};

            switch (entityType) {
                case 'secciones':
                    // User can see secciones they have direct access to
                    const accessibleSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleSeccionIds.length > 0) {
                        filterCondition.id = { [Op.in]: accessibleSeccionIds };
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;

                case 'localidades':
                    // User can see localidades they have direct access to
                    // OR localidades that belong to secciones they have access to
                    const accessibleLocalidadIds = userAccess
                        .filter(access => access.localidad_id)
                        .map(access => access.localidad_id);
                    
                    const accessibleLocalidadFromSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleLocalidadIds.length > 0 || accessibleLocalidadFromSeccionIds.length > 0) {
                        const whereConditions = [];
                        
                        if (accessibleLocalidadIds.length > 0) {
                            whereConditions.push({
                                id: { [Op.in]: accessibleLocalidadIds }
                            });
                        }
                        
                        if (accessibleLocalidadFromSeccionIds.length > 0) {
                            whereConditions.push({
                                seccion_id: { [Op.in]: accessibleLocalidadFromSeccionIds }
                            });
                        }
                        
                        filterCondition = { [Op.or]: whereConditions };
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;

                case 'circuitos':
                    // User can see circuitos they have direct access to
                    // OR circuitos in localidades they have access to (direct or via seccion)
                    // OR circuitos in localidades that belong to secciones they have access to
                    const accessibleCircuitoIds = userAccess
                        .filter(access => access.circuito_id)
                        .map(access => access.circuito_id);
                    
                    const accessibleCircuitoLocalidadIds = userAccess
                        .filter(access => access.localidad_id)
                        .map(access => access.localidad_id);
                    
                    const accessibleCircuitoSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleCircuitoIds.length > 0 || accessibleCircuitoLocalidadIds.length > 0 || accessibleCircuitoSeccionIds.length > 0) {
                        const whereConditions = [];
                        
                        if (accessibleCircuitoIds.length > 0) {
                            whereConditions.push({
                                id: { [Op.in]: accessibleCircuitoIds }
                            });
                        }
                        
                        if (accessibleCircuitoLocalidadIds.length > 0) {
                            whereConditions.push({
                                localidad_id: { [Op.in]: accessibleCircuitoLocalidadIds }
                            });
                        }
                        
                        if (accessibleCircuitoSeccionIds.length > 0) {
                            // Get localidades that belong to accessible secciones
                            const localidadesFromSecciones = await Localidad.findAll({
                                where: { seccion_id: { [Op.in]: accessibleCircuitoSeccionIds } },
                                attributes: ['id']
                            });
                            
                            if (localidadesFromSecciones.length > 0) {
                                const localidadIds = localidadesFromSecciones.map(l => l.id);
                                whereConditions.push({
                                    localidad_id: { [Op.in]: localidadIds }
                                });
                            }
                        }
                        
                        filterCondition = { [Op.or]: whereConditions };
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;

                case 'escuelas':
                    // User can see escuelas they have direct access to
                    // OR escuelas in circuitos they have access to (direct, via localidad, or via seccion)
                    // OR escuelas in localidades they have access to (direct or via seccion)
                    const accessibleEscuelaIds = userAccess
                        .filter(access => access.escuela_id)
                        .map(access => access.escuela_id);
                    
                    const accessibleEscuelaCircuitoIds = userAccess
                        .filter(access => access.circuito_id)
                        .map(access => access.circuito_id);
                    
                    const accessibleEscuelaLocalidadIds = userAccess
                        .filter(access => access.localidad_id)
                        .map(access => access.localidad_id);
                    
                    const accessibleEscuelaSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleEscuelaIds.length > 0 || accessibleEscuelaCircuitoIds.length > 0 || 
                        accessibleEscuelaLocalidadIds.length > 0 || accessibleEscuelaSeccionIds.length > 0) {
                        const whereConditions = [];
                        
                        if (accessibleEscuelaIds.length > 0) {
                            whereConditions.push({
                                id: { [Op.in]: accessibleEscuelaIds }
                            });
                        }
                        
                        if (accessibleEscuelaCircuitoIds.length > 0) {
                            whereConditions.push({
                                circuito_id: { [Op.in]: accessibleEscuelaCircuitoIds }
                            });
                        }
                        
                        if (accessibleEscuelaLocalidadIds.length > 0) {
                            // Get circuitos in accessible localidades
                            const circuitosFromLocalidades = await Circuito.findAll({
                                where: { localidad_id: { [Op.in]: accessibleEscuelaLocalidadIds } },
                                attributes: ['id']
                            });
                            
                            if (circuitosFromLocalidades.length > 0) {
                                const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                whereConditions.push({
                                    circuito_id: { [Op.in]: circuitoIds }
                                });
                            }
                        }
                        
                        if (accessibleEscuelaSeccionIds.length > 0) {
                            // Get localidades that belong to accessible secciones
                            const localidadesFromSecciones = await Localidad.findAll({
                                where: { seccion_id: { [Op.in]: accessibleEscuelaSeccionIds } },
                                attributes: ['id']
                            });
                            
                            if (localidadesFromSecciones.length > 0) {
                                const localidadIds = localidadesFromSecciones.map(l => l.id);
                                
                                // Get circuitos in those localidades
                                const circuitosFromLocalidades = await Circuito.findAll({
                                    where: { localidad_id: { [Op.in]: localidadIds } },
                                    attributes: ['id']
                                });
                                
                                if (circuitosFromLocalidades.length > 0) {
                                    const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                    whereConditions.push({
                                        circuito_id: { [Op.in]: circuitoIds }
                                    });
                                }
                            }
                        }
                        
                        filterCondition = { [Op.or]: whereConditions };
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;

                case 'mesas':
                    // User can see mesas they have direct access to
                    // OR mesas in escuelas they have access to (direct, via circuito, via localidad, or via seccion)
                    // OR mesas in circuitos they have access to (direct, via localidad, or via seccion)
                    // OR mesas in localidades they have access to (direct or via seccion)
                    const accessibleMesaIds = userAccess
                        .filter(access => access.mesa_id)
                        .map(access => access.mesa_id);
                    
                    const accessibleMesaEscuelaIds = userAccess
                        .filter(access => access.escuela_id)
                        .map(access => access.escuela_id);
                    
                    const accessibleMesaCircuitoIds = userAccess
                        .filter(access => access.circuito_id)
                        .map(access => access.circuito_id);
                    
                    const accessibleMesaLocalidadIds = userAccess
                        .filter(access => access.localidad_id)
                        .map(access => access.localidad_id);
                    
                    const accessibleMesaSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleMesaIds.length > 0 || accessibleMesaEscuelaIds.length > 0 || 
                        accessibleMesaCircuitoIds.length > 0 || accessibleMesaLocalidadIds.length > 0 || 
                        accessibleMesaSeccionIds.length > 0) {
                        const whereConditions = [];
                        
                        if (accessibleMesaIds.length > 0) {
                            whereConditions.push({
                                id: { [Op.in]: accessibleMesaIds }
                            });
                        }
                        
                        if (accessibleMesaEscuelaIds.length > 0) {
                            whereConditions.push({
                                escuela_id: { [Op.in]: accessibleMesaEscuelaIds }
                            });
                        }
                        
                        if (accessibleMesaCircuitoIds.length > 0) {
                            // Get escuelas in accessible circuitos
                            const escuelasFromCircuitos = await Escuela.findAll({
                                where: { circuito_id: { [Op.in]: accessibleMesaCircuitoIds } },
                                attributes: ['id']
                            });
                            
                            if (escuelasFromCircuitos.length > 0) {
                                const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                whereConditions.push({
                                    escuela_id: { [Op.in]: escuelaIds }
                                });
                            }
                        }
                        
                        if (accessibleMesaLocalidadIds.length > 0) {
                            // Get circuitos in accessible localidades
                            const circuitosFromLocalidades = await Circuito.findAll({
                                where: { localidad_id: { [Op.in]: accessibleMesaLocalidadIds } },
                                attributes: ['id']
                            });
                            
                            if (circuitosFromLocalidades.length > 0) {
                                const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                
                                // Get escuelas in those circuitos
                                const escuelasFromCircuitos = await Escuela.findAll({
                                    where: { circuito_id: { [Op.in]: circuitoIds } },
                                    attributes: ['id']
                                });
                                
                                if (escuelasFromCircuitos.length > 0) {
                                    const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                    whereConditions.push({
                                        escuela_id: { [Op.in]: escuelaIds }
                                    });
                                }
                            }
                        }
                        
                        if (accessibleMesaSeccionIds.length > 0) {
                            // Get localidades that belong to accessible secciones
                            const localidadesFromSecciones = await Localidad.findAll({
                                where: { seccion_id: { [Op.in]: accessibleMesaSeccionIds } },
                                attributes: ['id']
                            });
                            
                            if (localidadesFromSecciones.length > 0) {
                                const localidadIds = localidadesFromSecciones.map(l => l.id);
                                
                                // Get circuitos in those localidades
                                const circuitosFromLocalidades = await Circuito.findAll({
                                    where: { localidad_id: { [Op.in]: localidadIds } },
                                    attributes: ['id']
                                });
                                
                                if (circuitosFromLocalidades.length > 0) {
                                    const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                    
                                    // Get escuelas in those circuitos
                                    const escuelasFromCircuitos = await Escuela.findAll({
                                        where: { circuito_id: { [Op.in]: circuitoIds } },
                                        attributes: ['id']
                                    });
                                    
                                    if (escuelasFromCircuitos.length > 0) {
                                        const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                        whereConditions.push({
                                            escuela_id: { [Op.in]: escuelaIds }
                                        });
                                    }
                                }
                            }
                        }
                        
                        filterCondition = { [Op.or]: whereConditions };
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;

                case 'ciudadanos': {
                    // User can see ciudadanos that are assigned to mesas they have access to
                    // This includes direct mesa access, or indirect access through escuela, circuito, localidad, or seccion
                    const accessibleCiudadanoMesaIds = userAccess
                        .filter(access => access.mesa_id)
                        .map(access => access.mesa_id);
                    
                    const accessibleCiudadanoEscuelaIds = userAccess
                        .filter(access => access.escuela_id)
                        .map(access => access.escuela_id);
                    
                    const accessibleCiudadanoCircuitoIds = userAccess
                        .filter(access => access.circuito_id)
                        .map(access => access.circuito_id);
                    
                    const accessibleCiudadanoLocalidadIds = userAccess
                        .filter(access => access.localidad_id)
                        .map(access => access.localidad_id);
                    
                    const accessibleCiudadanoSeccionIds = userAccess
                        .filter(access => access.seccion_id)
                        .map(access => access.seccion_id);

                    if (accessibleCiudadanoMesaIds.length > 0 || accessibleCiudadanoEscuelaIds.length > 0 || 
                        accessibleCiudadanoCircuitoIds.length > 0 || accessibleCiudadanoLocalidadIds.length > 0 || 
                        accessibleCiudadanoSeccionIds.length > 0) {
                        
                        // Collect all accessible mesa IDs from different levels
                        let allAccessibleMesaIds = [...accessibleCiudadanoMesaIds];
                        
                        // From direct escuela access
                        if (accessibleCiudadanoEscuelaIds.length > 0) {
                            const mesasFromEscuelas = await Mesa.findAll({
                                where: { escuela_id: { [Op.in]: accessibleCiudadanoEscuelaIds } },
                                attributes: ['id']
                            });
                            
                            if (mesasFromEscuelas.length > 0) {
                                const mesaIds = mesasFromEscuelas.map(m => m.id);
                                allAccessibleMesaIds.push(...mesaIds);
                            }
                        }
                        
                        // From circuito access
                        if (accessibleCiudadanoCircuitoIds.length > 0) {
                            // Get escuelas in accessible circuitos
                            const escuelasFromCircuitos = await Escuela.findAll({
                                where: { circuito_id: { [Op.in]: accessibleCiudadanoCircuitoIds } },
                                attributes: ['id']
                            });
                            
                            if (escuelasFromCircuitos.length > 0) {
                                const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                
                                // Get mesas in those escuelas
                                const mesasFromEscuelas = await Mesa.findAll({
                                    where: { escuela_id: { [Op.in]: escuelaIds } },
                                    attributes: ['id']
                                });
                                
                                if (mesasFromEscuelas.length > 0) {
                                    const mesaIds = mesasFromEscuelas.map(m => m.id);
                                    allAccessibleMesaIds.push(...mesaIds);
                                }
                            }
                        }
                        
                        // From localidad access
                        if (accessibleCiudadanoLocalidadIds.length > 0) {
                            // Get circuitos in accessible localidades
                            const circuitosFromLocalidades = await Circuito.findAll({
                                where: { localidad_id: { [Op.in]: accessibleCiudadanoLocalidadIds } },
                                attributes: ['id']
                            });
                            
                            if (circuitosFromLocalidades.length > 0) {
                                const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                
                                // Get escuelas in those circuitos
                                const escuelasFromCircuitos = await Escuela.findAll({
                                    where: { circuito_id: { [Op.in]: circuitoIds } },
                                    attributes: ['id']
                                });
                                
                                if (escuelasFromCircuitos.length > 0) {
                                    const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                    
                                    // Get mesas in those escuelas
                                    const mesasFromEscuelas = await Mesa.findAll({
                                        where: { escuela_id: { [Op.in]: escuelaIds } },
                                        attributes: ['id']
                                    });
                                    
                                    if (mesasFromEscuelas.length > 0) {
                                        const mesaIds = mesasFromEscuelas.map(m => m.id);
                                        allAccessibleMesaIds.push(...mesaIds);
                                    }
                                }
                            }
                        }
                        
                        // From seccion access
                        if (accessibleCiudadanoSeccionIds.length > 0) {
                            // Get localidades that belong to accessible secciones
                            const localidadesFromSecciones = await Localidad.findAll({
                                where: { seccion_id: { [Op.in]: accessibleCiudadanoSeccionIds } },
                                attributes: ['id']
                            });
                            
                            if (localidadesFromSecciones.length > 0) {
                                const localidadIds = localidadesFromSecciones.map(l => l.id);
                                
                                // Get circuitos in those localidades
                                const circuitosFromLocalidades = await Circuito.findAll({
                                    where: { localidad_id: { [Op.in]: localidadIds } },
                                    attributes: ['id']
                                });
                                
                                if (circuitosFromLocalidades.length > 0) {
                                    const circuitoIds = circuitosFromLocalidades.map(c => c.id);
                                    
                                    // Get escuelas in those circuitos
                                    const escuelasFromCircuitos = await Escuela.findAll({
                                        where: { circuito_id: { [Op.in]: circuitoIds } },
                                        attributes: ['id']
                                    });
                                    
                                    if (escuelasFromCircuitos.length > 0) {
                                        const escuelaIds = escuelasFromCircuitos.map(e => e.id);
                                        
                                        // Get mesas in those escuelas
                                        const mesasFromEscuelas = await Mesa.findAll({
                                            where: { escuela_id: { [Op.in]: escuelaIds } },
                                            attributes: ['id']
                                        });
                                        
                                        if (mesasFromEscuelas.length > 0) {
                                            const mesaIds = mesasFromEscuelas.map(m => m.id);
                                            allAccessibleMesaIds.push(...mesaIds);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Remove duplicates and filter ciudadanos by accessible mesa IDs
                        const uniqueMesaIds = [...new Set(allAccessibleMesaIds)];
                        
                        if (uniqueMesaIds.length > 0) {
                            filterCondition.mesa_id = { [Op.in]: uniqueMesaIds };
                        } else {
                            filterCondition.id = null; // No access
                        }
                    } else {
                        filterCondition.id = null; // No access
                    }
                    break;
                }

                default:
                    // Unknown entity type, no access
                    filterCondition.id = null;
                    break;
            }

            // Store the filter condition for use in the route handler
            req.userAccessFilter = filterCondition;
            next();
        } catch (error) {
            console.error('Error in filterEntitiesByUserAccess middleware:', error);
            // On error, deny access
            req.userAccessFilter = { id: null };
            next();
        }
    };
};

module.exports = {
    filterEntitiesByUserAccess
};
