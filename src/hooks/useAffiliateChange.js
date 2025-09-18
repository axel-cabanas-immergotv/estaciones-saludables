import { useEffect, useRef } from 'react';

/**
 * Hook to listen for affiliate changes
 * @param {Function} callback - Function to call when affiliate changes
 * @param {Array} deps - Dependencies for the callback
 */
export const useAffiliateChange = (callback, deps = []) => {
    const callbackRef = useRef(callback);
    
    // Update the ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleAffiliateChange = (event) => {
            callbackRef.current(event.detail.affiliateId);
        };

        window.addEventListener('affiliateChanged', handleAffiliateChange);

        return () => {
            window.removeEventListener('affiliateChanged', handleAffiliateChange);
        };
    }, deps);
}; 