import { useAffiliate } from '../contexts/AffiliateContext';

/**
 * Hook to get current affiliate ID from context
 * This ensures services get the correct affiliate ID from React context
 * instead of reading directly from localStorage
 */
export const useAffiliateId = () => {
    const { getCurrentAffiliateId } = useAffiliate();
    return getCurrentAffiliateId();
};

/**
 * Hook to get current affiliate object from context
 */
export const useCurrentAffiliate = () => {
    const { currentAffiliate } = useAffiliate();
    return currentAffiliate;
};

/**
 * Hook to check if affiliate is selected
 */
export const useIsAffiliateSelected = () => {
    const { isAffiliateSelected } = useAffiliate();
    return isAffiliateSelected();
}; 