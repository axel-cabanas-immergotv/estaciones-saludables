import { getCurrentAffiliateId } from '../utils/affiliateUtils';

// Pages API Service
class PagesService {
    constructor() {
        this.baseUrl = '/api/admin/pages';
    }

    // Helper method for making API requests
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle validation errors specifically
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const validationMessages = errorData.errors.map(err => 
                        `${err.field}: ${err.message}`
                    ).join(', ');
                    throw new Error(`Validation failed: ${validationMessages}`);
                }
                
                throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get all entities with pagination and filters
    async get(params = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = ''
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        
        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);

        // Add affiliate_id to query params
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            queryParams.append('affiliate_id', affiliateId);
        }

        const endpoint = `${this.baseUrl}?${queryParams.toString()}`;
        return await this.makeRequest(endpoint);
    }

    // Get single entity by ID
    async getById(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        const endpoint = `${this.baseUrl}/${id}${queryParams}`;
        const response = await this.makeRequest(endpoint);
        
        // Process content field - convert JSON string back to object for content
        if (response.success && response.data && response.data.content) {
            try {
                if (typeof response.data.content === 'string') {
                    response.data.content = JSON.parse(response.data.content);
                }
            } catch (error) {
                console.warn('Error parsing content JSON:', error);
                response.data.content = { blocks: [] };
            }
        }
        
        return response;
    }

    // Create new entity
    async create(entityData) {
        // Process content field - convert content object to JSON string
        if (entityData.content && typeof entityData.content === 'object') {
            entityData.content = JSON.stringify(entityData.content);
        }

        // Add affiliate_id to entity data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            entityData.affiliate_id = parseInt(affiliateId);
        }
        
        return await this.makeRequest(this.baseUrl, {
            method: 'POST',
            body: JSON.stringify(entityData)
        });
    }

    // Update existing entity
    async update(id, entityData) {
        console.log('PagesService update called with:', { id, entityData });
        
        // Process content field - convert content object to JSON string
        if (entityData.content && typeof entityData.content === 'object') {
            console.log('PagesService converting content object to JSON string');
            entityData.content = JSON.stringify(entityData.content);
            console.log('PagesService content after conversion:', entityData.content);
        }

        // Add affiliate_id to entity data
        const affiliateId = getCurrentAffiliateId();
        if (affiliateId) {
            entityData.affiliate_id = parseInt(affiliateId);
        }
        
        console.log('PagesService final entityData to send:', entityData);
        
        const endpoint = `${this.baseUrl}/${id}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(entityData)
        });
    }

    // Delete entity
    async delete(id) {
        const affiliateId = getCurrentAffiliateId();
        const queryParams = affiliateId ? `?affiliate_id=${affiliateId}` : '';
        const endpoint = `${this.baseUrl}/${id}${queryParams}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    // Generate slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    // Validate entity data
    validateEntityData(entityData) {
        const errors = {};

        if (!entityData.title || entityData.title.trim() === '') {
            errors.title = 'Title is required';
        }

        if (!entityData.slug || entityData.slug.trim() === '') {
            errors.slug = 'Slug is required';
        } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entityData.slug)) {
            errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
        }

        if (!['draft', 'published'].includes(entityData.status)) {
            errors.status = 'Status must be either draft or published';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Get default entity data structure
    getDefaultEntityData() {
        return {
            title: '',
            slug: '',
            content: { blocks: [] },
            seo_title: '',
            meta_title: '',
            meta_description: '',
            meta_keywords: '',
            meta_robots: 'index,follow',
            status: 'draft',
            custom_css: '',
            show_in_menu: true,
            parent_id: null,
            sort_order: 0
        };
    }

    // Format entity data for display
    formatEntityForDisplay(entity) {
        return {
            ...entity,
            formatted_date: entity.created_at ? new Date(entity.created_at).toLocaleDateString() : '',
            author_name: entity.author ? `${entity.author.first_name} ${entity.author.last_name}` : 'Unknown',
            status_badge: entity.status === 'published' ? 'success' : 'warning',
            content_preview: entity.content ? this.getContentPreview(entity.content) : 'No content'
        };
    }

    // Get content preview from content blocks
    getContentPreview(content, maxLength = 100) {
        // Handle both string and object content
        let contentObj = content;
        if (typeof content === 'string') {
            try {
                contentObj = JSON.parse(content);
            } catch (error) {
                return 'Invalid content format';
            }
        }
        
        if (!contentObj || !contentObj.blocks || contentObj.blocks.length === 0) {
            return 'No content';
        }

        const textBlocks = contentObj.blocks
            .filter(block => block.type === 'paragraph' || block.type === 'header')
            .map(block => block.data.text || '')
            .join(' ');

        const cleanText = textBlocks.replace(/<[^>]*>/g, ''); // Remove HTML tags
        return cleanText.length > maxLength 
            ? cleanText.substring(0, maxLength) + '...'
            : cleanText;
    }
}

// Export singleton instance
const pagesService = new PagesService();
export default pagesService; 