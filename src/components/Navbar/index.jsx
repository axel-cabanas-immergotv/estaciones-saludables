import React from 'react';
import './navbar.css';

const Navbar = ({ 
    user, 
    onLogout, 
    onToggleMobileSidebar,
    showMobileToggle = true 
}) => {

    return (
        <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
            <div className="container-fluid">
                <div className='d-flex align-items-center'>
                    {showMobileToggle && (
                        <button 
                            className="btn btn-link d-lg-none text-white me-2"
                            onClick={onToggleMobileSidebar}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                    )}
                    
                    <span className="navbar-brand mb-0">
                        {/* <img src={logo} alt="Logo" className="logo-img" /> */}
                        <h4 className='text-black'><i className='fas fa-map-marker-alt me-2'></i> Estaciones Saludables</h4>
                        
                    </span>
                </div>
                
                <div className="navbar-nav flex-row">
                    {/* User Dropdown */}
                    <div className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i className="fas fa-user-circle me-1"></i>
                            {user?.first_name?.charAt(0).toUpperCase() + user?.first_name?.slice(1)} {user?.last_name?.charAt(0).toUpperCase() + user?.last_name?.slice(1)}
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <button className="dropdown-item" onClick={onLogout}>
                                    <i className="fas fa-sign-out-alt me-2"></i>
                                    Salir
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 