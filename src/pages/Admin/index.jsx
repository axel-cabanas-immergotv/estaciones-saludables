import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import './admin.css';

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setUser(data.user);
                    } else {
                        navigate('/login');
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    const toggleMobileSidebar = () => {
        setMobileSidebarOpen(!mobileSidebarOpen);
    };

    // Get current section from location pathname
    const getCurrentSection = () => {
        const path = location.pathname.replace('/admin/', '').replace('/admin', '');
        return path === '' ? 'mi-equipo' : path;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-app">
            {/* Top Navigation Bar */}
            <Navbar 
                user={user}
                onLogout={handleLogout}
                onToggleMobileSidebar={toggleMobileSidebar}
            />

            {/* Main Container */}
            <div className="admin-container">
                {/* Sidebar */}
                <Sidebar 
                    currentSection={getCurrentSection()}
                    mobileSidebarOpen={mobileSidebarOpen}
                    onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
                    userPermissions={user?.permissions || []}
                    userRole={user?.role || null}
                />

                {/* Main Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div 
                    className="mobile-sidebar-overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Admin; 