import React, { useState, useEffect } from 'react';
import './affiliateMembers.css';

const AffiliateMembers = ({ 
    affiliateId, 
    affiliateName, // Add affiliate name prop
    members, 
    availableMembers, 
    onAddMember, 
    onUpdatePermissions, 
    onRemoveMember,
    permissionOptions 
}) => {
    console.log('🔍 AffiliateMembers component received:', { affiliateId, affiliateName, membersCount: members?.length, availableMembersCount: availableMembers?.length });
    console.log('🔍 AffiliateMembers props:', { 
        affiliateId, 
        membersCount: members?.length, 
        availableMembersCount: availableMembers?.length,
        members: members,
        availableMembers: availableMembers
    });
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberPermissions, setMemberPermissions] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMemberId, setNewMemberId] = useState('');
    const [newMemberPermissions, setNewMemberPermissions] = useState({});

    // Initialize permissions for new member
    useEffect(() => {
        if (permissionOptions) {
            const initialPermissions = {};
            permissionOptions.forEach(option => {
                initialPermissions[option.name] = false;
            });
            setNewMemberPermissions(initialPermissions);
        }
    }, [permissionOptions]);

    const handleAddMember = async () => {
        console.log('🔍 handleAddMember called:', { 
            newMemberId, 
            newMemberPermissions, 
            affiliateId 
        });
        
        if (!newMemberId) {
            alert('Please select a member to add');
            return;
        }

        try {
            console.log('📤 Calling onAddMember with:', {
                affiliateId,
                toAffiliateId: parseInt(newMemberId),
                permissions: newMemberPermissions
            });
            
            await onAddMember(affiliateId, parseInt(newMemberId), newMemberPermissions);
            
            console.log('✅ Member added successfully');
            setShowAddForm(false);
            setNewMemberId('');
            setNewMemberPermissions({});
        } catch (error) {
            console.error('❌ Error adding member:', error);
            alert('Error adding member: ' + error.message);
        }
    };

    const handleUpdatePermissions = async (memberId, permissions) => {
        try {
            await onUpdatePermissions(affiliateId, memberId, permissions);
        } catch (error) {
            console.error('Error updating permissions:', error);
            alert('Error updating permissions: ' + error.message);
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            await onRemoveMember(affiliateId, memberId);
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error removing member: ' + error.message);
        }
    };

    const handlePermissionChange = (memberId, permissionName, checked) => {
        if (memberId) {
            // Update existing member permissions
            const member = members.find(m => m.toAffiliate && m.toAffiliate.id === memberId);
            if (member) {
                const updatedPermissions = {
                    can_use: member.can_use || false,
                    can_copy: member.can_copy || false,
                    can_assign: member.can_assign || false,
                    access_publishers: member.access_publishers || false,
                    [permissionName]: checked
                };
                handleUpdatePermissions(memberId, updatedPermissions);
            }
        } else {
            // Update new member permissions
            setNewMemberPermissions(prev => ({
                ...prev,
                [permissionName]: checked
            }));
        }
    };

    const renderPermissionCheckbox = (permission, memberId = null) => {
        const isChecked = memberId 
            ? members.find(m => m.toAffiliate && m.toAffiliate.id === memberId)?.[permission.name] || false
            : newMemberPermissions[permission.name];

        return (
            <div key={permission.name} className="form-check">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id={`${memberId || 'new'}-${permission.name}`}
                    checked={isChecked || false}
                    onChange={(e) => handlePermissionChange(memberId, permission.name, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`${memberId || 'new'}-${permission.name}`}>
                    {permission.label}
                    {permission.description && (
                        <small className="form-text text-muted d-block">
                            {permission.description}
                        </small>
                    )}
                </label>
            </div>
        );
    };

    const renderMemberRow = (member) => {
        const affiliate = member.toAffiliate;
        if (!affiliate) return null;

        // Get personalized labels for this specific member
        const memberPersonalizedLabels = getMemberPersonalizedLabels(affiliate.name);

        return (
            <tr key={member.id}>
                <td className="member-info">
                    <h6>{affiliate.name}</h6>
                    <small className="text-muted">{affiliate.slug}</small>
                </td>
                {memberPersonalizedLabels.map(permission => (
                    <td key={permission.name} className="permission-column">
                        <input
                            type="checkbox"
                            className="form-check-input permission-checkbox"
                            checked={member[permission.name] || false}
                            onChange={(e) => handlePermissionChange(affiliate.id, permission.name, e.target.checked)}
                            title={permission.description}
                        />
                    </td>
                ))}
                <td className="member-actions">
                    <button
                        type="button"
                        className="remove-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveMember(affiliate.id);
                        }}
                        title="Remove member"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        );
    };

    // Generate personalized permission labels with real affiliate names
    const getPersonalizedPermissionLabels = () => {
        console.log('🔍 getPersonalizedPermissionLabels called with affiliateName:', affiliateName);
        
        if (!affiliateName) {
            console.log('⚠️ No affiliateName provided, using original labels');
            return permissionOptions;
        }
        
        const personalized = permissionOptions.map(permission => ({
            ...permission,
            label: permission.label
                .replace('B can use content from A', `This can use content from ${affiliateName}`)
                .replace('B can copy content from A', `This can copy content from ${affiliateName}`)
                .replace('B can assign content to A', `This can assign content to ${affiliateName}`)
                .replace('Access to A enabled for B\'s publishers', `Access to ${affiliateName} enabled for his publisher`)
        }));
        
        console.log('✅ Personalized labels generated:', personalized.map(p => p.label));
        return personalized;
    };

    // Generate personalized labels for each member row
    const getMemberPersonalizedLabels = (memberAffiliateName) => {
        if (!memberAffiliateName) return permissionOptions;
        
        return permissionOptions.map(permission => ({
            ...permission,
            label: permission.label
                .replace('B can use content from A', `${memberAffiliateName} can use content from current affiliate`)
                .replace('B can copy content from A', `${memberAffiliateName} can copy content from current affiliate`)
                .replace('B can assign content to A', `${memberAffiliateName} can assign content to current affiliate`)
                .replace('Access to A enabled for B\'s publishers', `Access to current affiliate enabled for ${memberAffiliateName}'s publishers`)
        }));
    };

    const personalizedPermissionOptions = getPersonalizedPermissionLabels();

    // Safety check for data
    if (!members || !Array.isArray(members)) {
        console.warn('⚠️ Members data is not available or not an array:', members);
        return (
            <div className="affiliate-members">
                <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Loading affiliate members...
                </div>
            </div>
        );
    }

    if (!availableMembers || !Array.isArray(availableMembers)) {
        console.warn('⚠️ Available members data is not available or not an array:', availableMembers);
        return (
            <div className="affiliate-members">
                <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Loading available affiliates...
                </div>
            </div>
        );
    }

    return (
        <div className="affiliate-members">
            <div className="members-header">
                <h5>Affiliate Members</h5>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddForm(!showAddForm);
                    }}
                >
                    <i className="fas fa-plus me-1"></i>
                    Add Member
                </button>
            </div>

            {showAddForm && (
                <div className="add-member-form">
                    <div className="form-group">
                        <label>Select Affiliate to Add as Member:</label>
                        <select
                            className="form-control"
                            value={newMemberId}
                            onChange={(e) => setNewMemberId(e.target.value)}
                        >
                            <option value="">Choose an affiliate...</option>
                            {availableMembers.map(affiliate => (
                                <option key={affiliate.id} value={affiliate.id}>
                                    {affiliate.name} ({affiliate.slug})
                                </option>
                            ))}
                        </select>
                    </div>

                                {newMemberId && (
                <div className="permissions-section">
                    <label>Permissions:</label>
                    <div className="permissions-grid">
                        {personalizedPermissionOptions.map(permission => 
                            renderPermissionCheckbox(permission)
                        )}
                    </div>
                </div>
            )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddMember();
                            }}
                            disabled={!newMemberId}
                        >
                            Add Member
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm ms-2"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAddForm(false);
                                setNewMemberId('');
                                setNewMemberPermissions({});
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="members-list">
                {members.length === 0 ? (
                    <div className="no-members">
                        <p className="text-muted">No members added yet.</p>
                    </div>
                ) : (
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Affiliate</th>
                                {personalizedPermissionOptions.map(permission => (
                                    <th key={permission.name} className="permission-column" title={permission.description}>
                                        {permission.label}
                                    </th>
                                ))}
                                <th className="member-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(renderMemberRow)}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AffiliateMembers; 