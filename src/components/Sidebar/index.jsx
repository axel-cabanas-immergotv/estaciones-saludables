import { NavLink } from 'react-router-dom';
import './sidebar.css';

const Sidebar = ({ 
    mobileSidebarOpen = false,
    userRole = null,
    onCloseMobileSidebar
}) => {
    
    // Helper function to check permissions (simplified for now)
    const hasPermission = () => {
        // For now, return true for all permissions
        // This will be implemented properly with the permission system
        return true;
    };

    // Function to get visible items based on user role
    const getVisibleItemsForRole = (roleName) => {
        const roleVisibility = {
            'admin': [
                'mi-equipo',
                'estacion',
                'seccion', 
                'circuito',
                'escuela',
                'mesa',
                'ciudadanos',
                'users',
                'roles',
                'permissions',
                'affiliates',
                'actividades'
            ],
            // To do: implementar roles
        };

        return roleVisibility[roleName] || [];
    };

    // Get visible sections for current user role
    const visibleSections = userRole?.name ? getVisibleItemsForRole(userRole.name) : [];

    const sidebarItems = [
        // Mi Equipo
        {
            section: 'mi-equipo',
            icon: 'fas fa-users-alt',
            label: 'Mi Equipo',
            standalone: true
        },
        
        // Content Section
        {
            group: 'Territorio',
            items: [
              {
                section: 'estacion',
                icon: 'fas fa-map-marked-alt',
                label: 'Estaciones'
              },
              {
                section: 'actividades',
                icon: 'fas fa-map-marker-alt',
                label: 'Actividades'
              },
              {
                section: 'ciudadanos',
                icon: 'fas fa-user',
                label: 'Ciudadanos',
                permission: 'ciudadanos.read'
              },
            ]
        },


        // Users Section
        {
            group: 'Users',
            permission: 'users.read',
            items: [
                {
                    section: 'users',
                    icon: 'fas fa-users',
                    label: 'Usuarios'
                },
                {
                    section: 'roles',
                    icon: 'fas fa-user-shield',
                    label: 'Roles',
                    permission: 'roles.read'
                },
                {
                    section: 'permissions',
                    icon: 'fas fa-key',
                    label: 'Permisos',
                    permission: 'permissions.read'
                }
            ]
        },
    ];

    // Filter sidebar items based on visible sections
    const getFilteredSidebarItems = () => {
        return sidebarItems.map(item => {
            if (item.standalone) {
                // Check if standalone item is visible for current role
                if (!visibleSections.includes(item.section)) {
                    return null;
                }
                return item;
            }

            // For grouped items, filter based on visible sections
            if (item.group) {
                const filteredItems = item.items.filter(subItem => 
                    visibleSections.includes(subItem.section)
                );

                // Only return group if it has visible items
                if (filteredItems.length === 0) {
                    return null;
                }

                return {
                    ...item,
                    items: filteredItems
                };
            }

            return item;
        }).filter(Boolean); // Remove null items
    };

    const renderSidebarItem = (item) => (
        <NavLink
            key={item.section}
            to={`/admin/${item.section}`}
            className={({ isActive }) => 
                `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onCloseMobileSidebar && onCloseMobileSidebar()}
        >
            <i className={item.icon}></i>
            <span>{item.label}</span>
        </NavLink>
    );

    const renderSidebarGroup = (group) => {
        // Check if group has permission requirement
        if (group.permission && !hasPermission(group.permission)) {
            return null;
        }

        return (
            <div key={group.group} className="sidebar-section">
                {group.group && <h6 className="sidebar-header">{group.group}</h6>}
                {group.items.map(item => {
                    // Check individual item permissions
                    if (item.permission && !hasPermission(item.permission)) {
                        return null;
                    }
                    return renderSidebarItem(item);
                })}
            </div>
        );
    };

    // Get filtered items
    const filteredItems = getFilteredSidebarItems();

    return (
        <aside className={`admin-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
            {filteredItems.map(item => {
                if (item.standalone) {
                    return (
                        <div key={item.section} className="sidebar-section">
                            {renderSidebarItem(item)}
                        </div>
                    );
                }
                return renderSidebarGroup(item);
            })}
        </aside>
    );
};

export default Sidebar; 