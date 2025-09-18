import { useState, useEffect, useRef } from 'react';
import EntityTable from '../../../components/EntityTable';
import AffiliateMembers from '../../../components/AffiliateMembers';
import affiliatesService from '../../../services/affiliatesService';
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';
import ContentHeader from '../../../components/ContentHeader';

const AffiliatesPage = () => {
    // State management (standard for all entities)
    const [affiliates, setAffiliates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [members, setMembers] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const tableRef = useRef(null);

    // API methods (standard names for all entities)
    const load = async (page, limit, search, filters) => {
        setLoading(true);
        try {
            const params = {
                page: page || currentPage,
                limit: limit || pageSize,
                search: search !== undefined ? search : currentSearch,
                ...filters
            };

            const response = await affiliatesService.get(params);
            
            if (response.success) {
                setAffiliates(response.data);
                setPagination(response.pagination);
                setCurrentPage(params.page);
                setPageSize(params.limit);
                setCurrentSearch(params.search);
                setCurrentFilters(filters || {});
            } else {
                console.error('Error loading affiliates:', response.message);
            }
        } catch (error) {
            console.error('Error loading affiliates:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadForEditing = async (id) => {
        try {
            const response = await affiliatesService.getById(id);
            if (response.success) {
                const affiliate = response.data;
                
                // Load members and available members
                try {
                    const [membersResponse, availableResponse] = await Promise.all([
                        affiliatesService.getMembers(id),
                        affiliatesService.getAvailableMembers(id)
                    ]);
                    
                    if (membersResponse.success) {
                        setMembers(membersResponse.data);
                    }
                    
                    if (availableResponse.success) {
                        setAvailableMembers(availableResponse.data);
                    }
                } catch (memberError) {
                    console.error('Error loading affiliate members:', memberError);
                    setMembers([]);
                    setAvailableMembers([]);
                }
                
                return affiliate;
            } else {
                throw new Error(response.message || 'Affiliate not found');
            }
        } catch (error) {
            console.error('Error loading affiliate for editing:', error);
            throw error;
        }
    };

    const save = async (data, id) => {
        try {
            let response;
            if (id) {
                response = await affiliatesService.update(id, data);
            } else {
                response = await affiliatesService.create(data);
            }
            
            if (response.success) {
                await load(); // Refresh the table
                return response.data;
            } else {
                throw new Error(response.message || 'Error saving affiliate');
            }
        } catch (error) {
            console.error('Error saving affiliate:', error);
            throw error;
        }
    };

    const deleteAffiliate = async (id) => {
        if (!confirm('Are you sure you want to delete this affiliate?')) {
            return;
        }

        try {
            const response = await affiliatesService.delete(id);
            if (response.success) {
                await load(); // Refresh the table
            } else {
                throw new Error(response.message || 'Error deleting affiliate');
            }
        } catch (error) {
            console.error('Error deleting affiliate:', error);
            throw error;
        }
    };

    // Member management methods
    const addMember = async (affiliateId, toAffiliateId, permissions) => {
        try {
            const response = await affiliatesService.addMember(affiliateId, toAffiliateId, permissions);
            if (response.success) {
                // Reload members and available members
                const [membersResponse, availableResponse] = await Promise.all([
                    affiliatesService.getMembers(affiliateId),
                    affiliatesService.getAvailableMembers(affiliateId)
                ]);
                
                if (membersResponse.success) {
                    setMembers(membersResponse.data);
                }
                
                if (availableResponse.success) {
                    setAvailableMembers(availableResponse.data);
                }
                
                return response.data;
            } else {
                throw new Error(response.message || 'Error adding member');
            }
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    };

    const updateMemberPermissions = async (affiliateId, memberId, permissions) => {
        try {
            const response = await affiliatesService.updateMemberPermissions(affiliateId, memberId, permissions);
            if (response.success) {
                // Reload members
                const membersResponse = await affiliatesService.getMembers(affiliateId);
                if (membersResponse.success) {
                    setMembers(membersResponse.data);
                }
                return response.data;
            } else {
                throw new Error(response.message || 'Error updating member permissions');
            }
        } catch (error) {
            console.error('Error updating member permissions:', error);
            throw error;
        }
    };

    const removeMember = async (affiliateId, memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) {
            return;
        }

        try {
            const response = await affiliatesService.removeMember(affiliateId, memberId);
            if (response.success) {
                // Reload members and available members
                const [membersResponse, availableResponse] = await Promise.all([
                    affiliatesService.getMembers(affiliateId),
                    affiliatesService.getAvailableMembers(affiliateId)
                ]);
                
                if (membersResponse.success) {
                    setMembers(membersResponse.data);
                }
                
                if (availableResponse.success) {
                    setAvailableMembers(availableResponse.data);
                }
                
                return response.data;
            } else {
                throw new Error(response.message || 'Error removing member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        }
    };

    // Load affiliates on component mount
    useEffect(() => {
        load();
        loadCurrentUser();
    }, []);

    // Listen for affiliate changes and reload data
    useAffiliateChange((affiliateId) => {
        console.log('Affiliate changed, reloading data...');
        load();
    }, []);

    // Load current user
    const loadCurrentUser = async () => {
        try {
            const user = await affiliatesService.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    // Get default data for new affiliate
    const getDefaultData = () => {
        return affiliatesService.getDefaultAffiliateData();
    };

    // Table configuration
    const tableConfig = {
        tableId: 'affiliates-table',
        entityType: 'affiliate',
        emptyMessage: 'No affiliates found. Create your first affiliate!',
        enableSearch: true,
        
        columns: [
            {
                header: 'Affiliate',
                field: 'name',
                type: 'text-with-subtitle',
                subtitleField: 'slug'
            },
            {
                header: 'Type',
                field: 'type',
                type: 'badge',
                badgeClass: (value) => {
                    switch(value) {
                        case 'organization': return 'bg-primary';
                        case 'individual': return 'bg-success';
                        case 'partner': return 'bg-info';
                        case 'sponsor': return 'bg-warning';
                        default: return 'bg-light';
                    }
                }
            },
            {
                header: 'Contact',
                field: 'contact_email',
                type: 'text'
            },
            {
                header: 'Website',
                field: 'website_url',
                type: 'code'
            },
            {
                header: 'Status',
                field: 'status',
                type: 'badge',
                badgeClass: (value) => {
                    switch(value) {
                        case 'active': return 'bg-success';
                        case 'inactive': return 'bg-warning';
                        default: return 'bg-light';
                    }
                }
            },
            {
                header: 'Created',
                field: 'created_at',
                type: 'date'
            }
        ],

        filters: [
            {
                field: 'type',
                label: 'Type',
                placeholder: 'All Types',
                options: affiliatesService.getTypeOptions()
            },
            {
                field: 'status',
                label: 'Status',
                placeholder: 'All Statuses',
                options: affiliatesService.getStatusOptions()
            }
        ],

        actionHandlers: {
            delete: (type, id) => deleteAffiliate(id)
        },
        showViewButton: false, // Affiliates don't have a view page

        // Event handlers (standard for all entities)
        onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
        onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
        onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

        // Editor configuration
        editorType: 'modal',
        editorConfig: {
            title: 'Affiliate Editor',
            modalWidth: 'modal-80', // Use 80% width for affiliates modal
            getDefaultData: getDefaultData,
            fields: [
                { name: 'name', label: 'Affiliate Name', type: 'text', required: true, placeholder: 'e.g., Acme Corporation' },
                { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'e.g., acme-corporation' },
                { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Describe the affiliate organization' },
                { name: 'type', label: 'Type', type: 'select', options: affiliatesService.getTypeOptions() },
                { name: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'contact@example.com' },
                { name: 'contact_phone', label: 'Contact Phone', type: 'text', placeholder: '+1-555-123-4567' },
                { name: 'website_url', label: 'Website URL', type: 'url', placeholder: 'https://example.com' },
                { name: 'status', label: 'Status', type: 'select', options: affiliatesService.getStatusOptions() },
                // Custom field for affiliate members - only shown when editing
                { 
                    name: 'members', 
                    label: 'Affiliate Members', 
                    type: 'custom', 
                    show: (formData) => !!formData.id, // Only show when editing existing affiliate
                    render: (value, onChange, formData) => {
                        return (
                            <AffiliateMembers
                                affiliateId={formData.id}
                                affiliateName={formData.name}
                                members={members}
                                availableMembers={availableMembers}
                                onAddMember={addMember}
                                onUpdatePermissions={updateMemberPermissions}
                                onRemoveMember={removeMember}
                                permissionOptions={affiliatesService.getPermissionOptions()}
                            />
                        );
                    }
                },
                // Example of alternative custom field approaches:
                // 
                // 1. Using component reference (alternative to render function):
                // { 
                //     name: 'members_alt', 
                //     label: 'Members (Alt)', 
                //     type: 'custom', 
                //     component: AffiliateMembers,
                //     props: { 
                //         affiliateId: formData.id,
                //         affiliateName: formData.name,
                //         members: members,
                //         availableMembers: availableMembers,
                //         onAddMember: addMember,
                //         onUpdatePermissions: updateMemberPermissions,
                //         onRemoveMember: removeMember,
                //         permissionOptions: affiliatesService.getPermissionOptions()
                //     }
                // },
                //
                // 2. Using conditional rendering with complex logic:
                // { 
                //     name: 'premium_features', 
                //     label: 'Premium Features', 
                //     type: 'custom', 
                //     show: (formData) => formData.type === 'premium' && formData.status === 'active',
                //     render: (value, onChange, formData) => <PremiumFeaturesComponent />
                // }
            ],
            customValidation: (formData) => {
                const errors = {};
                
                if (!formData.name || !formData.name.trim()) {
                    errors.name = 'Affiliate name is required';
                }
                
                if (!formData.slug || !formData.slug.trim()) {
                    errors.slug = 'Slug is required';
                }
                
                if (formData.contact_email && !affiliatesService.isValidEmail(formData.contact_email)) {
                    errors.contact_email = 'Invalid email format';
                }
                
                // Auto-generate slug if empty
                if (!formData.slug && formData.name) {
                    formData.slug = affiliatesService.generateSlug(formData.name);
                }
                
                return errors;
            },
            // Custom render function to include members section
            // This customRender function is no longer needed as members are now a custom field
            // customRender: (formData, onChange, isEditing) => {
            //     console.log('🔍 customRender called:', { isEditing, formDataId: formData?.id, membersCount: members.length, availableMembersCount: availableMembers.length });
                
            //     if (!isEditing) {
            //         console.log('❌ Not editing, returning null');
            //         return null; // Only show members section when editing existing affiliate
            //     }
                
            //     console.log('✅ Rendering AffiliateMembers component');
            //     return (
            //         <AffiliateMembers
            //             affiliateId={formData.id}
            //             affiliateName={formData.name} // Pass the affiliate name
            //             members={members}
            //             availableMembers={availableMembers}
            //             onAddMember={addMember}
            //             onUpdatePermissions={updateMemberPermissions}
            //             onRemoveMember={removeMember}
            //             permissionOptions={affiliatesService.getPermissionOptions()}
            //         />
            //     );
            // }
        },
        onLoadEntity: loadForEditing,
        onSaveEntity: save
    };

    // UI handlers
    const handleCreateNew = () => {
        if (tableRef.current && tableRef.current.handleCreateNew) {
            tableRef.current.handleCreateNew();
        }
    };

    return (
        <div className="content-section">
            <ContentHeader
                icon='fas fa-handshake'
                title='Affiliates'
                description='Afiliados'
                handleCreateNew={handleCreateNew}
                buttonText='Add New Affiliate'
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <EntityTable
                                ref={tableRef}
                                data={{ data: affiliates, pagination }}
                                config={tableConfig}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AffiliatesPage; 