const express = require('express');
const { verifyToken } = require('../middleware/auth');

// Import models
const { User, Role, UserAccess, Escuela, Mesa, Localidad, Circuito } = require('../models');
const { Op } = require('sequelize');

// Import entity routers

const usersRouter = require('./admin/users');
const rolesRouter = require('./admin/roles');
const permissionsRouter = require('./admin/permissions');
const affiliatesRouter = require('./admin/affiliates');
const localidadesRouter = require('./admin/localidades');
const circuitosRouter = require('./admin/circuitos');
const escuelasRouter = require('./admin/escuelas');
const mesasRouter = require('./admin/mesas');
const ciudadanosRouter = require('./admin/ciudadanos');
const seccionRouter = require('./admin/seccion');
const router = express.Router();

// Apply authentication to all admin routes
router.use(verifyToken);

// Link data endpoint for Editor.js LinkTool
router.get('/link-data', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        // Simple response - In production, you might want to fetch actual metadata
        res.json({
            success: true,
            link: url,
            meta: {
                title: 'Link',
                description: 'External link',
                image: {
                    url: ''
                }
            }
        });

    } catch (error) {
        console.error('Error fetching link data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching link data'
        });
    }
});

// BI route for metrics
router.get('/bi', async (req, res) => {
    try {

        // Get current user from request (set by verifyToken middleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        

        // Get user with role and access information
        const user = await User.findByPk(userId, {
            include: [
                { model: Role, as: 'role' },
                { model: UserAccess, as: 'access_assignments' }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        let metrics = {};

        // Get metrics based on user's access level
        if (user.role.name === 'admin' || user.role.name === 'jefe_campana') {
            // Admin and jefe_campana can see all metrics
            metrics = await getAllMetrics();
        } else {
            // Other roles see metrics only for their assigned entities
            metrics = await getMetricsForUserAccess(user.access_assignments);
        }

        res.json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('Error getting BI metrics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Helper function to get all metrics (for admin/jefe_campana)
async function getAllMetrics() {
    try {
        // Get total schools
        const totalSchools = await Escuela.count();
        
        // Get schools with fiscal general assigned
        const schoolsWithFiscalGeneral = await Escuela.count({
            include: [{
                model: UserAccess,
                as: 'user_assignments',
                where: {
                    status: 'active'
                },
                include: [{
                    model: User,
                    as: 'user',
                    include: [{
                        model: Role,
                        as: 'role',
                        where: { name: 'fiscal_general' }
                    }]
                }]
            }]
        });

        // Get schools without fiscal general
        const schoolsWithoutFiscalGeneral = totalSchools - schoolsWithFiscalGeneral;

        // Get total mesas
        const totalMesas = await Mesa.count();
        
        // Get mesas with fiscal de mesa assigned
        const mesasWithFiscalMesa = await Mesa.count({
            include: [{
                model: UserAccess,
                as: 'user_assignments',
                where: {
                    status: 'active'
                },
                include: [{
                    model: User,
                    as: 'user',
                    include: [{
                        model: Role,
                        as: 'role',
                        where: { name: 'fiscal_mesa' }
                    }]
                }]
            }]
        });

        // Get mesas without fiscal de mesa
        const mesasWithoutFiscalMesa = totalMesas - mesasWithFiscalMesa;

        return {
            escuelas: {
                total: totalSchools,
                conFiscalGeneral: schoolsWithFiscalGeneral,
                sinFiscalGeneral: schoolsWithoutFiscalGeneral
            },
            mesas: {
                total: totalMesas,
                conFiscalMesa: mesasWithFiscalMesa,
                sinFiscalMesa: mesasWithoutFiscalMesa
            }
        };
    } catch (error) {
        console.error('Error getting all metrics:', error);
        throw error;
    }
}

// Helper function to get metrics for specific user access with hierarchical propagation
async function getMetricsForUserAccess(userAccess) {
    try {
        let metrics = {
            escuelas: { total: 0, conFiscalGeneral: 0, sinFiscalGeneral: 0 },
            mesas: { total: 0, conFiscalMesa: 0, sinFiscalMesa: 0 }
        };

        // Collect all accessible entity IDs with hierarchical propagation
        const accessibleSeccionIds = userAccess
            .filter(access => access.seccion_id)
            .map(access => access.seccion_id);

        const accessibleLocalidadIds = userAccess
            .filter(access => access.localidad_id)
            .map(access => access.localidad_id);

        const accessibleCircuitoIds = userAccess
            .filter(access => access.circuito_id)
            .map(access => access.circuito_id);

        const accessibleEscuelaIds = userAccess
            .filter(access => access.escuela_id)
            .map(access => access.escuela_id);

        const accessibleMesaIds = userAccess
            .filter(access => access.mesa_id)
            .map(access => access.mesa_id);

        // Get all accessible entities considering hierarchy
        const allAccessibleEntities = await getAllAccessibleEntities(
            accessibleSeccionIds,
            accessibleLocalidadIds,
            accessibleCircuitoIds,
            accessibleEscuelaIds,
            accessibleMesaIds
        );

        // Calculate metrics for all accessible entities
        metrics = await calculateMetricsForEntities(allAccessibleEntities);

        return metrics;
    } catch (error) {
        console.error('Error getting metrics for user access:', error);
        throw error;
    }
}

// Helper function to get all accessible entities considering hierarchy using optimized SQL
async function getAllAccessibleEntities(seccionIds, localidadIds, circuitoIds, escuelaIds, mesaIds) {
    try {
        // Build the WHERE clause for accessible entities
        const whereConditions = [];
        
        if (seccionIds.length > 0) {
            whereConditions.push(`s.id IN (${seccionIds.join(',')})`);
        }
        if (localidadIds.length > 0) {
            whereConditions.push(`l.id IN (${localidadIds.join(',')})`);
        }
        if (circuitoIds.length > 0) {
            whereConditions.push(`c.id IN (${circuitoIds.join(',')})`);
        }
        if (escuelaIds.length > 0) {
            whereConditions.push(`e.id IN (${escuelaIds.join(',')})`);
        }
        if (mesaIds.length > 0) {
            whereConditions.push(`m.id IN (${mesaIds.join(',')})`);
        }
        
        // If no specific access, return empty result
        if (whereConditions.length === 0) {
            return { escuelas: [], mesas: [] };
        }
        
        const whereClause = whereConditions.join(' OR ');
        
        // Single optimized query to get all accessible entities with hierarchy
        const query = `
            SELECT DISTINCT
                e.id as escuela_id,
                m.id as mesa_id
            FROM secciones s
            LEFT JOIN localidades l ON l.seccion_id = s.id
            LEFT JOIN circuitos c ON c.localidad_id = l.id
            LEFT JOIN escuelas e ON e.circuito_id = c.id
            LEFT JOIN mesas m ON m.escuela_id = e.id
            WHERE (${whereClause})
            AND e.id IS NOT NULL
        `;
        
        const [results] = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
        
        // Extract unique IDs
        const escuelas = [...new Set(results.map(r => r.escuela_id).filter(Boolean))];
        const mesas = [...new Set(results.map(r => r.mesa_id).filter(Boolean))];
        
        return { escuelas, mesas };
    } catch (error) {
        console.error('Error in getAllAccessibleEntities:', error);
        return { escuelas: [], mesas: [] };
    }
}

// Helper function to calculate metrics for all accessible entities
async function calculateMetricsForEntities(accessibleEntities) {
    let metrics = {
        escuelas: { total: 0, conFiscalGeneral: 0, sinFiscalGeneral: 0 },
        mesas: { total: 0, conFiscalMesa: 0, sinFiscalMesa: 0 }
    };

    // Calculate escuela metrics
    const escuelaIds = Array.from(accessibleEntities.escuelas);
    if (escuelaIds.length > 0) {
        metrics.escuelas.total = escuelaIds.length;
        
        for (const escuelaId of escuelaIds) {
            const hasFiscalGeneral = await checkEscuelaHasFiscalGeneral(escuelaId);
            if (hasFiscalGeneral) {
                metrics.escuelas.conFiscalGeneral++;
            } else {
                metrics.escuelas.sinFiscalGeneral++;
            }
        }
    }

    // Calculate mesa metrics
    const mesaIds = Array.from(accessibleEntities.mesas);
    if (mesaIds.length > 0) {
        metrics.mesas.total = mesaIds.length;
        
        for (const mesaId of mesaIds) {
            const hasFiscalMesa = await checkMesaHasFiscalMesa(mesaId);
            if (hasFiscalMesa) {
                metrics.mesas.conFiscalMesa++;
            } else {
                metrics.mesas.sinFiscalMesa++;
            }
        }
    }

    return metrics;
}









// Helper function to check if an escuela has a fiscal general assigned
async function checkEscuelaHasFiscalGeneral(escuelaId) {
    try {
        const access = await UserAccess.findOne({
            where: {
                escuela_id: escuelaId,
                status: 'active'
            },
            include: [{
                model: User,
                as: 'user',
                include: [{
                    model: Role,
                    as: 'role',
                    where: { name: 'fiscal_general' }
                }]
            }]
        });

        return !!access;
    } catch (error) {
        console.error('Error checking escuela fiscal general:', error);
        return false;
    }
}

// Helper function to check if a mesa has a fiscal de mesa assigned
async function checkMesaHasFiscalMesa(mesaId) {
    try {
        const access = await UserAccess.findOne({
            where: {
                mesa_id: mesaId,
                status: 'active'
            },
            include: [{
                model: User,
                as: 'user',
                include: [{
                    model: Role,
                    as: 'role',
                    where: { name: 'fiscal_mesa' }
                }]
            }]
        });

        return !!access;
    } catch (error) {
        console.error('Error checking mesa fiscal de mesa:', error);
        return false;
    }
}



// Mount entity routers
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/permissions', permissionsRouter);
router.use('/affiliates', affiliatesRouter);
router.use('/localidades', localidadesRouter);
router.use('/circuitos', circuitosRouter);
router.use('/escuelas', escuelasRouter);
router.use('/mesas', mesasRouter); 
router.use('/ciudadanos', ciudadanosRouter);
router.use('/seccion', seccionRouter);

module.exports = router; 