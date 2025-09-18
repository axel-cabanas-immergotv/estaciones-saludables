import React, { createContext, useContext, useState, useEffect } from 'react';
import affiliatesService from '../services/affiliatesService';
import { setCurrentAffiliateId, getCurrentAffiliateId } from '../utils/affiliateUtils';

// Create context
const AffiliateContext = createContext();

// Custom hook to use affiliate context
export const useAffiliate = () => {
    const context = useContext(AffiliateContext);
    if (!context) {
        throw new Error('useAffiliate must be used within an AffiliateProvider');
    }
    return context;
};

// Provider component
export const AffiliateProvider = ({ children }) => {
    const [currentAffiliate, setCurrentAffiliate] = useState(null);
    const [userAffiliates, setUserAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user's affiliates on mount
    useEffect(() => {
        loadUserAffiliates();
    }, []);



    const loadUserAffiliates = async () => {
        try {
            setLoading(true);

            const response = await affiliatesService.get();
            
            if (response.success) {
                setUserAffiliates(response.data);
                // If no current affiliate is set, use the first one
                if (!currentAffiliate && response.data.length > 0) {
                    const storedAffiliateId = localStorage.getItem('currentAffiliateId');
                    const affiliateToUse = storedAffiliateId 
                        ? response.data.find(a => a.id == storedAffiliateId)
                        : response.data[0];
                

                    if (affiliateToUse) {
                        setCurrentAffiliate(affiliateToUse);
                        setCurrentAffiliateId(affiliateToUse.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user affiliates:', error);
            setError('Failed to load affiliates');
        } finally {
            setLoading(false);
        }
    };



    const switchAffiliate = async (affiliateId) => {
        try {
            // Find affiliate in user's affiliates
            const affiliate = userAffiliates.find(a => a.id === affiliateId);
            if (affiliate) {
                setCurrentAffiliate(affiliate);
                setCurrentAffiliateId(affiliateId);
                
                // Trigger a refresh of all data that depends on affiliate context
                // This will update any components that use affiliate-dependent data
                // The event is listened by useAffiliateChange hook in entity pages
                window.dispatchEvent(new CustomEvent('affiliateChanged', { 
                    detail: { affiliateId } 
                }));
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error switching affiliate:', error);
            setError('Failed to switch affiliate');
            return false;
        }
    };

    const refreshAffiliates = async () => {
        await loadUserAffiliates();
    };

    const getCurrentAffiliateName = () => {
        return currentAffiliate?.name || 'No Affiliate Selected';
    };

    const isAffiliateSelected = () => {
        return !!currentAffiliate;
    };

    const value = {
        currentAffiliate,
        userAffiliates,
        loading,
        error,
        switchAffiliate,
        refreshAffiliates,
        getCurrentAffiliateId: getCurrentAffiliateId,
        getCurrentAffiliateName,
        isAffiliateSelected
    };

    return (
        <AffiliateContext.Provider value={value}>
            {children}
        </AffiliateContext.Provider>
    );
};

export default AffiliateContext; 