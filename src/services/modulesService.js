import { getCurrentAffiliateId } from '../utils/affiliateUtils';

class ModulesService {
    constructor() {
        this.baseUrl = '/api/admin/modules';
    }

    // Get current affiliate ID from localStorage
    getCurrentAffiliateId() {
        return localStorage.getItem('currentAffiliateId');
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error('ModulesService request error:', error);
            throw error;
        }
    }

    async get(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.type) queryParams.append('type', params.type);
        
        // Add affiliate_id from current context
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `?${queryString}` : '';
        
        return this.makeRequest(endpoint);
    }

    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        return this.makeRequest(`/${id}${queryParams}`);
    }

    async create(data) {
        // Modules cannot be created, they are system entities
        throw new Error('Modules cannot be created. They are system entities that can only be edited.');
    }

    async update(id, data) {
        // Add affiliate_id to module data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            data.affiliate_id = parseInt(affiliateId);
        }

        return this.makeRequest(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(id) {
        // Modules cannot be deleted, they are system entities
        throw new Error('Modules cannot be deleted. They are system entities that can only be edited.');
    }

    // Utility methods
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    validateModuleData(data) {
        const errors = {};
        
        if (!data.type || !data.type.trim()) {
            errors.type = 'Module type is required';
        }
        
        if (!data.display_name || !data.display_name.trim()) {
            errors.display_name = 'Display name is required';
        }
        
        return errors;
    }

    getDefaultModuleData() {
        return {
            type: '',
            display_name: '',
            description: '',
            content: JSON.stringify({
                time: Date.now(),
                blocks: [
                    {
                        type: 'header',
                        data: {
                            text: 'New Module',
                            level: 2
                        }
                    },
                    {
                        type: 'paragraph',
                        data: {
                            text: 'Module content will be here.'
                        }
                    }
                ]
            }),
            custom_css: '',
            status: 'active',
            sort_order: 0
        };
    }

    formatModuleForDisplay(module) {
        return {
            ...module,
            type_label: this.getModuleTypeLabel(module.type),
            content_blocks_count: this.getContentBlocksCount(module.content)
        };
    }

    getModuleTypeLabel(type) {
        switch(type) {
            case 'header': return 'Header Module';
            case 'footer': return 'Footer Module';
            case 'sidebar': return 'Sidebar Module';
            case 'custom': return 'Custom Module';
            default: return 'Unknown Module';
        }
    }

    getContentBlocksCount(content) {
        if (!content) return 0;
        try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            return parsed.blocks ? parsed.blocks.length : 0;
        } catch (error) {
            return 0;
        }
    }
}

export default new ModulesService(); 