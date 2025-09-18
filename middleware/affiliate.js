const { Affiliate, UserAffiliate } = require('../models');

/**
 * Middleware to handle affiliate context for all operations
 * This ensures that all data operations are scoped to the current affiliate
 */
const affiliateMiddleware = async (req, res, next) => {
    try {
        // Get affiliate_id from session, query param, or header
        const affiliateId = req.session?.affiliate_id || 
                          req.query.affiliate_id || 
                          req.body.affiliate_id ||
                          req.headers['x-affiliate-id'];

        if (affiliateId) {
            // Verify the affiliate exists and user has access
            const affiliate = await Affiliate.findByPk(affiliateId);
            
            if (!affiliate) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Affiliate not found' 
                });
            }

            // Check if user has access to this affiliate
            if (req.user) {
                const userAffiliate = await UserAffiliate.findOne({
                    where: {
                        user_id: req.user.id,
                        affiliate_id: affiliateId
                    }
                });

                if (!userAffiliate) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Access denied to this affiliate' 
                    });
                }
            }

            // Store affiliate in request for use in routes
            req.currentAffiliate = affiliate;
            req.affiliateId = affiliateId;
        }

        next();
    } catch (error) {
        console.error('Affiliate middleware error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

/**
 * Middleware to require affiliate context
 * Use this when affiliate_id is required for the operation
 */
const requireAffiliate = (req, res, next) => {
    if (!req.currentAffiliate) {
        return res.status(400).json({ 
            success: false, 
            message: 'Affiliate context is required' 
        });
    }
    next();
};

/**
 * Helper function to add affiliate_id to where clause
 */
const addAffiliateFilter = (whereClause, affiliateId) => {
    if (affiliateId) {
        return {
            ...whereClause,
            affiliate_id: affiliateId
        };
    }
    return whereClause;
};

/**
 * Helper function to add affiliate_id to data object
 */
const addAffiliateToData = (data, affiliateId) => {
    if (affiliateId) {
        return {
            ...data,
            affiliate_id: affiliateId
        };
    }
    return data;
};

module.exports = {
    affiliateMiddleware,
    requireAffiliate,
    addAffiliateFilter,
    addAffiliateToData
}; 