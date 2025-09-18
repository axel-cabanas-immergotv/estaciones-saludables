/**
 * User Relations Service - Handles user-affiliate relationships
 * Follows standardized service interface
 */
class UserRelationsService {
    constructor() {
        this.baseUrl = '/api/admin/user-affiliates';
    }

    /**
     * Helper method to make API requests with proper error handling
     * @param {string} endpoint - API endpoint 
     * @param {object} options - Request options
     * @returns {Promise<object>} API response
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies for JWT
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('User Relations API Error:', error);
            throw error;
        }
    }

    /**
     * Get all users for selection (without affiliate relationships)
     * @returns {Promise<Array>} Array of users
     */
    async getAvailableUsers() {
        try {
            const response = await fetch('/api/admin/users?limit=1000', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching available users:', error);
            return [];
        }
    }

    /**
     * Get users associated with an affiliate
     * @param {number} affiliateId - Affiliate ID
     * @returns {Promise<Array>} Array of users
     */
    async getUsersByAffiliate(affiliateId) {
        try {
            const response = await fetch(`/api/admin/affiliates/${affiliateId}/users`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching affiliate users:', error);
            return [];
        }
    }

    /**
     * Add users to an affiliate
     * @param {number} affiliateId - Affiliate ID
     * @param {Array} userIds - Array of user IDs to add
     * @returns {Promise<object>} Result
     */
    async addUsersToAffiliate(affiliateId, userIds) {
        return await this.makeRequest(`/affiliate/${affiliateId}/users`, {
            method: 'POST',
            body: JSON.stringify({ user_ids: userIds })
        });
    }

    /**
     * Remove users from an affiliate
     * @param {number} affiliateId - Affiliate ID
     * @param {Array} userIds - Array of user IDs to remove
     * @returns {Promise<object>} Result
     */
    async removeUsersFromAffiliate(affiliateId, userIds) {
        return await this.makeRequest(`/affiliate/${affiliateId}/users`, {
            method: 'DELETE',
            body: JSON.stringify({ user_ids: userIds })
        });
    }

    /**
     * Update affiliate users (replace all)
     * @param {number} affiliateId - Affiliate ID
     * @param {Array} userIds - Array of user IDs
     * @returns {Promise<object>} Result
     */
    async updateAffiliateUsers(affiliateId, userIds) {
        return await this.makeRequest(`/affiliate/${affiliateId}/users`, {
            method: 'PUT',
            body: JSON.stringify({ user_ids: userIds })
        });
    }

    /**
     * Get all users for dropdown selection
     * @returns {Promise<Array>} Array of users with email and id
     */
    async getUsersForSelection() {
        const users = await this.getAvailableUsers();
        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name || user.email
        }));
    }
}

export default new UserRelationsService(); 