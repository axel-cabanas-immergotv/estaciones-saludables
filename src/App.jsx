import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import Login from './pages/Login';
import UsersPage from './pages/Admin/Users';
import PermissionsPage from './pages/Admin/Permissions';
import RolesPage from './pages/Admin/Roles';
import AffiliatesPage from './pages/Admin/Affiliates';
import MiEquipoPage from './pages/Admin/MiEquipo';
import LocalidadPage from './pages/Admin/Localidad';
import SeccionPage from './pages/Admin/Seccion';
import ActividadesPage from './pages/Admin/Actividades';
import CircuitoPage from './pages/Admin/Circuito';
import EscuelaPage from './pages/Admin/Escuela';
import MesaPage from './pages/Admin/Mesa';
import CiudadanoPage from './pages/Admin/Ciudadano';
import { AffiliateProvider } from './contexts/AffiliateContext';
import './App.css';

// Error Boundary Component to prevent white screen
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('React Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{
                    padding: '20px',
                    maxWidth: '800px',
                    margin: '50px auto',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
                        Something went wrong
                    </h2>
                    <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                        An error occurred while rendering the application. Please check the console for more details.
                    </p>
                    
                    <div style={{ 
                        backgroundColor: '#fff', 
                        padding: '15px', 
                        borderRadius: '4px', 
                        border: '1px solid #dee2e6',
                        marginBottom: '20px'
                    }}>
                        <h5 style={{ color: '#495057', marginBottom: '10px' }}>Error Details:</h5>
                        <pre style={{ 
                            fontSize: '12px', 
                            color: '#dc3545',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </div>

                    <div style={{ 
                        backgroundColor: '#fff', 
                        padding: '15px', 
                        borderRadius: '4px', 
                        border: '1px solid #dee2e6',
                        marginBottom: '20px'
                    }}>
                        <h5 style={{ color: '#495057', marginBottom: '10px' }}>Stack Trace:</h5>
                        <pre style={{ 
                            fontSize: '11px', 
                            color: '#6c757d',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            <i className="fas fa-refresh" style={{ marginRight: '5px' }}></i>
                            Reload Page
                        </button>
                        <button 
                            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
                            style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fas fa-retry" style={{ marginRight: '5px' }}></i>
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
  return (
    <ErrorBoundary>
      <AffiliateProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />}>
              <Route index element={<Navigate to="/admin/mi-equipo" replace />} />
              <Route path="mi-equipo" element={<MiEquipoPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
              <Route path="affiliates" element={<AffiliatesPage />} />
              <Route path="estacion" element={<LocalidadPage />} />
              <Route path="seccion" element={<SeccionPage />} />
              <Route path="actividades" element={<ActividadesPage />} />
              <Route path="circuito" element={<CircuitoPage />} />
              <Route path="escuela" element={<EscuelaPage />} />
              <Route path="mesa" element={<MesaPage />} />
              <Route path="ciudadanos" element={<CiudadanoPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Router>
      </AffiliateProvider>
    </ErrorBoundary>
  );
}

export default App;
