import React, { useState, useEffect } from 'react';
import './UserAccessLevels.css';

const UserAccessLevels = ({ userAccessData = [] }) => {
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const getAccessTypeLabel = (accessType) => {
        const labels = {
            'localidad': 'Localidad',
            'circuito': 'Circuito',
            'escuela': 'Escuela',
            'mesa': 'Mesa'
        };
        return labels[accessType] || accessType;
    };

    const getAccessTypeIcon = (accessType) => {
        const icons = {
            'localidad': 'fas fa-city',
            'circuito': 'fas fa-route',
            'escuela': 'fas fa-school',
            'mesa': 'fas fa-table'
        };
        return icons[accessType] || 'fas fa-key';
    };

    const renderAccessItem = (access) => {
        let displayName = '';
        let details = '';

        if (access.mesa) {
            displayName = `Mesa ${access.mesa.numero}`;
            details = access.mesa.escuela ? `Escuela: ${access.mesa.escuela.nombre}` : '';
        } else if (access.escuela) {
            displayName = access.escuela.nombre;
            details = access.escuela.localidad ? `Localidad: ${access.escuela.localidad.nombre}` : '';
        } else if (access.circuito) {
            displayName = access.circuito.nombre;
            details = access.circuito.localidad ? `Localidad: ${access.circuito.localidad.nombre}` : '';
        } else if (access.localidad) {
            displayName = access.localidad.nombre;
            details = access.localidad.provincia ? `Provincia: ${access.localidad.provincia.nombre}` : '';
        }

        return (
            <div key={access.id} className="access-item">
                <div className="access-item-header">
                    <i className={`${getAccessTypeIcon(access.access_type)} access-icon`}></i>
                    <span className="access-name">{displayName}</span>
                    <span className="access-type-badge">
                        {getAccessTypeLabel(access.access_type)}
                    </span>
                </div>
                {details && (
                    <div className="access-details">
                        <small className="text-muted">{details}</small>
                    </div>
                )}
            </div>
        );
    };

    const groupAccessByType = () => {
        const grouped = {};
        
        userAccessData.forEach(access => {
            const type = access.access_type;
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(access);
        });

        return grouped;
    };

    const groupedAccess = groupAccessByType();

    if (!userAccessData || userAccessData.length === 0) {
        return (
            <div className="user-access-levels">
                <div className="access-section">
                    <div className="access-section-header">
                        <i className="fas fa-key"></i>
                        <span>Niveles de Acceso</span>
                    </div>
                    <div className="no-access-message">
                        <p>No tienes niveles de acceso configurados</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-access-levels">
            <div className="access-section">
                <div className="access-section-header">
                    <i className="fas fa-key"></i>
                    <span>Niveles de Acceso</span>
                    <span className="access-count">({userAccessData.length})</span>
                </div>
                
                <div className="access-content">
                    {Object.entries(groupedAccess).map(([accessType, accesses]) => (
                        <div key={accessType} className="access-type-group">
                            <div 
                                className="access-type-header"
                                onClick={() => toggleSection(accessType)}
                            >
                                <i className={`${getAccessTypeIcon(accessType)} me-2`}></i>
                                <span>{getAccessTypeLabel(accessType)}</span>
                                <span className="access-count">({accesses.length})</span>
                                <i className={`fas fa-chevron-${expandedSections[accessType] ? 'up' : 'down'} ms-auto`}></i>
                            </div>
                            
                            {expandedSections[accessType] && (
                                <div className="access-type-content">
                                    {accesses.map(renderAccessItem)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserAccessLevels;
