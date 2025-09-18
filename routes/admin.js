const express = require('express');
const { verifyToken } = require('../middleware/auth');

// Import models and sequelize instance
const { User, Role, UserAccess, Escuela, Mesa, Localidad, Circuito, sequelize } = require('../models');
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

// BI route for metrics - OPTIMIZED VERSION
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
            metrics = await getAllMetricsOptimized();
        } else {
            // Other roles see metrics only for their assigned entities
            metrics = await getMetricsForUserAccessOptimized(user.access_assignments);
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

// OPTIMIZED: Single query to get all metrics (for admin/jefe_campana)
async function getAllMetricsOptimized() {
    try {
        // Single optimized query with LEFT JOINs to get all metrics at once
        const query = `
            SELECT 
                -- Escuela metrics
                COUNT(DISTINCT e.id) as total_escuelas,
                COUNT(DISTINCT CASE WHEN ua_escuela.id IS NOT NULL THEN e.id END) as escuelas_con_fiscal_general,
                COUNT(DISTINCT CASE WHEN ua_escuela.id IS NULL THEN e.id END) as escuelas_sin_fiscal_general,
                
                -- Mesa metrics
                COUNT(DISTINCT m.id) as total_mesas,
                COUNT(DISTINCT CASE WHEN ua_mesa.id IS NOT NULL THEN m.id END) as mesas_con_fiscal_mesa,
                COUNT(DISTINCT CASE WHEN ua_mesa.id IS NULL THEN m.id END) as mesas_sin_fiscal_mesa
            FROM escuelas e
            LEFT JOIN mesas m ON m.escuela_id = e.id
            LEFT JOIN users_access ua_escuela ON ua_escuela.escuela_id = e.id 
                AND ua_escuela.status = 'active'
                AND EXISTS (
                    SELECT 1 FROM users u 
                    JOIN roles r ON r.id = u.role_id 
                    WHERE u.id = ua_escuela.user_id 
                    AND r.name = 'fiscal_general'
                )
            LEFT JOIN users_access ua_mesa ON ua_mesa.mesa_id = m.id 
                AND ua_mesa.status = 'active'
                AND EXISTS (
                    SELECT 1 FROM users u 
                    JOIN roles r ON r.id = u.role_id 
                    WHERE u.id = ua_mesa.user_id 
                    AND r.name = 'fiscal_mesa'
                )
        `;
        
        const [result] = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        return {
            escuelas: {
                total: parseInt(result.total_escuelas) || 0,
                conFiscalGeneral: parseInt(result.escuelas_con_fiscal_general) || 0,
                sinFiscalGeneral: parseInt(result.escuelas_sin_fiscal_general) || 0
            },
            mesas: {
                total: parseInt(result.total_mesas) || 0,
                conFiscalMesa: parseInt(result.mesas_con_fiscal_mesa) || 0,
                sinFiscalMesa: parseInt(result.mesas_sin_fiscal_mesa) || 0
            }
        };
    } catch (error) {
        console.error('Error getting all metrics:', error);
        throw error;
    }
}

// OPTIMIZED: Get metrics for specific user access with hierarchical propagation
async function getMetricsForUserAccessOptimized(userAccess) {
    try {
        // Collect all accessible entity IDs
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

        // Get all accessible entities considering hierarchy using single optimized query
        const allAccessibleEntities = await getAllAccessibleEntitiesOptimized(
            accessibleSeccionIds,
            accessibleLocalidadIds,
            accessibleCircuitoIds,
            accessibleEscuelaIds,
            accessibleMesaIds
        );

        // Calculate metrics for all accessible entities using single optimized query
        const metrics = await calculateMetricsForEntitiesOptimized(allAccessibleEntities);

        return metrics;
    } catch (error) {
        console.error('Error getting metrics for user access:', error);
        throw error;
    }
}

// OPTIMIZED: Single query to get all accessible entities considering hierarchy
async function getAllAccessibleEntitiesOptimized(seccionIds, localidadIds, circuitoIds, escuelaIds, mesaIds) {
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
        // Note: Based on actual table structure, secciones are not directly related to localidades
        let query;
        
        if (seccionIds.length > 0) {
            // If user has access to secciones, we need to handle this differently
            // For now, we'll skip secciones and focus on direct access
            query = `
                SELECT DISTINCT
                    e.id as escuela_id,
                    m.id as mesa_id
                FROM localidades l
                LEFT JOIN circuitos c ON c.localidad_id = l.id
                LEFT JOIN escuelas e ON e.circuito_id = c.id
                LEFT JOIN mesas m ON m.escuela_id = e.id
                WHERE (${whereConditions.filter(c => !c.includes('s.id')).join(' OR ')})
                AND e.id IS NOT NULL
            `;
        } else {
            // Standard hierarchy: Localidad -> Circuito -> Escuela -> Mesa
            query = `
                SELECT DISTINCT
                    e.id as escuela_id,
                    m.id as mesa_id
                FROM localidades l
                LEFT JOIN circuitos c ON c.localidad_id = l.id
                LEFT JOIN escuelas e ON e.circuito_id = c.id
                LEFT JOIN mesas m ON m.escuela_id = e.id
                WHERE (${whereClause})
                AND e.id IS NOT NULL
            `;
        }
        
        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
        
        // Extract unique IDs
        const escuelas = [...new Set(results.map(r => r.escuela_id).filter(Boolean))];
        const mesas = [...new Set(results.map(r => r.mesa_id).filter(Boolean))];
        
        return { escuelas, mesas };
    } catch (error) {
        console.error('Error in getAllAccessibleEntitiesOptimized:', error);
        return { escuelas: [], mesas: [] };
    }
}

// OPTIMIZED: Single query to calculate metrics for all accessible entities
async function calculateMetricsForEntitiesOptimized(accessibleEntities) {
    try {
        if (accessibleEntities.escuelas.length === 0 && accessibleEntities.mesas.length === 0) {
            return {
                escuelas: { total: 0, conFiscalGeneral: 0, sinFiscalGeneral: 0 },
                mesas: { total: 0, conFiscalMesa: 0, sinFiscalMesa: 0 }
            };
        }
        
        // Build WHERE clause for accessible entities
        const escuelaWhere = accessibleEntities.escuelas.length > 0 ? 
            `e.id IN (${accessibleEntities.escuelas.join(',')})` : '1=0';
        const mesaWhere = accessibleEntities.mesas.length > 0 ? 
            `m.id IN (${accessibleEntities.mesas.join(',')})` : '1=0';
        
        // Single optimized query to get all metrics at once
        // Simplified query without secciones table
        const metricsQuery = `
            SELECT 
                -- Escuela metrics
                COUNT(DISTINCT e.id) as total_escuelas,
                COUNT(DISTINCT CASE WHEN ua_escuela.id IS NOT NULL THEN e.id END) as escuelas_con_fiscal_general,
                COUNT(DISTINCT CASE WHEN ua_escuela.id IS NULL THEN e.id END) as escuelas_sin_fiscal_general,
                
                -- Mesa metrics
                COUNT(DISTINCT m.id) as total_mesas,
                COUNT(DISTINCT CASE WHEN ua_mesa.id IS NOT NULL THEN m.id END) as mesas_con_fiscal_mesa,
                COUNT(DISTINCT CASE WHEN ua_mesa.id IS NULL THEN m.id END) as mesas_sin_fiscal_mesa
            FROM escuelas e
            LEFT JOIN mesas m ON m.escuela_id = e.id
            LEFT JOIN users_access ua_escuela ON ua_escuela.escuela_id = e.id 
                AND ua_escuela.status = 'active'
                AND EXISTS (
                    SELECT 1 FROM users u 
                    JOIN roles r ON r.id = u.role_id 
                    WHERE u.id = ua_escuela.user_id 
                    AND r.name = 'fiscal_general'
                )
            LEFT JOIN users_access ua_mesa ON ua_mesa.mesa_id = m.id 
                AND ua_mesa.status = 'active'
                AND EXISTS (
                    SELECT 1 FROM users u 
                    JOIN roles r ON r.id = u.role_id 
                    WHERE u.id = ua_mesa.user_id 
                    AND r.name = 'fiscal_mesa'
                )
            WHERE (${escuelaWhere} OR ${mesaWhere})
        `;
        
        const [metricsResult] = await sequelize.query(metricsQuery, {
            type: sequelize.QueryTypes.SELECT
        });
        
        return {
            escuelas: {
                total: parseInt(metricsResult.total_escuelas) || 0,
                conFiscalGeneral: parseInt(metricsResult.escuelas_con_fiscal_general) || 0,
                sinFiscalGeneral: parseInt(metricsResult.escuelas_sin_fiscal_general) || 0
            },
            mesas: {
                total: parseInt(metricsResult.total_mesas) || 0,
                conFiscalMesa: parseInt(metricsResult.mesas_con_fiscal_mesa) || 0,
                sinFiscalMesa: parseInt(metricsResult.mesas_sin_fiscal_mesa) || 0
            }
        };
    } catch (error) {
        console.error('Error in calculateMetricsForEntitiesOptimized:', error);
        return {
            escuelas: { total: 0, conFiscalGeneral: 0, sinFiscalGeneral: 0 },
            mesas: { total: 0, conFiscalMesa: 0, sinFiscalMesa: 0 }
        };
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
