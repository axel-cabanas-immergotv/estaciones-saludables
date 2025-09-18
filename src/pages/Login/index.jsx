import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import logo from '../../assets/logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({
        show: false,
        type: 'error',
        message: ''
    });

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // User is already logged in, redirect to admin
                        navigate('/admin');
                    }
                }
            } catch {
                // User is not logged in, continue with login page
                console.log('Not authenticated');
            }
        };

        checkAuth();

        // Auto-focus email field
        setTimeout(() => {
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.focus();
            }
        }, 100);
    }, [navigate]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        // Validate email/telefono field
        const identifier = form.email.trim();
        if (!identifier) {
            newErrors.email = 'El teléfono o email es requerido';
            isValid = false;
        } else if (!isValidEmail(identifier) && !isValidTelefono(identifier)) {
            newErrors.email = 'Por favor ingrese un email o teléfono válido';
            isValid = false;
        }

        // Validate password
        if (!form.password) {
            newErrors.password = 'Contraseña requerida';
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = 'La contraseña debe ser solo numérica';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidTelefono = (telefono) => {
        const telefonoRegex = /^[0-9]+$/;
        return telefonoRegex.test(telefono);
    };

    const showAlert = (type, message) => {
        setAlert({
            show: true,
            type,
            message
        });
    };

    const hideAlert = () => {
        setAlert({ ...alert, show: false });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Reset errors and alerts
        setErrors({});
        hideAlert();

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Determine what type of identifier the user entered
            const identifier = form.email.trim();
            const isEmail = isValidEmail(identifier);
            const isPhone = isValidTelefono(identifier);
            
            // Prepare login data with only the appropriate field
            const loginData = {
                password: form.password
            };
            
            if (isEmail) {
                loginData.email = identifier;
            } else if (isPhone) {
                loginData.telefono = identifier;
            }

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (data.success) {
                showAlert('success', 'Usuario logueado correctamente');
                
                // Get user's affiliates and set the first one in localStorage
                try {
                    const affiliatesResponse = await fetch('/api/admin/affiliates', {
                        credentials: 'include'
                    });
                    
                    if (affiliatesResponse.ok) {
                        const affiliatesData = await affiliatesResponse.json();
                        if (affiliatesData.success && affiliatesData.data.length > 0) {
                            // Set the first affiliate in localStorage
                            const firstAffiliate = affiliatesData.data[0];
                            localStorage.setItem('currentAffiliateId', firstAffiliate.id.toString());
                        }
                    }
                } catch {
                    console.log('Could not load affiliates, continuing with login');
                }
                
                // Redirect to admin panel
                setTimeout(() => {
                    navigate('/admin');
                }, 1000);
            } else {
                showAlert('error', data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="login-card p-5">
                            {/* Header */}
                            <div className="text-center mb-5">
                                {/* <img src={logo} alt="Logo" className="logo-img-login" /> */}
                                <h2>Estaciones Saludables</h2>
                                <p className="text-muted">Ingresa con tu teléfono/email y tu DNI</p>
                            </div>

                            {/* Alert Messages */}
                            {alert.show && (
                                <div className={`alert alert-dismissible fade show mb-4 ${alert.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
                                    <span>{alert.message}</span>
                                    <button type="button" className="btn-close" onClick={hideAlert}></button>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleLogin} noValidate>
                                {/* Email Field */}
                                <div className="mb-4">
                                    <label htmlFor="email" className="form-label fw-semibold">
                                        <i className="fas fa-envelope me-2"></i>Email / Teléfono
                                    </label>
                                    <input 
                                        type="text" 
                                        id="email"
                                        name="email"
                                        className="form-control"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        placeholder="Teléfono/Email"
                                        required
                                        autoComplete="email"
                                    />
                                    {errors.email && (
                                        <div className="text-danger small mt-1">{errors.email}</div>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label fw-semibold">
                                        <i className="fas fa-lock me-2"></i>Password
                                    </label>
                                    <div className="position-relative">
                                        <input 
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            className="form-control pe-5"
                                            value={form.password}
                                            onChange={handleInputChange}
                                            placeholder="Tu DNI"
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button 
                                            type="button"
                                            className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={`${showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} text-muted`}></i>
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="text-danger small mt-1">{errors.password}</div>
                                    )}
                                </div>


                                {/* Submit Button */}
                                <div className="d-grid mb-4">
                                    <button 
                                        type="submit" 
                                        className="btn btn-login text-white"
                                        disabled={loading}
                                    >
                                        {!loading ? (
                                            <>
                                                <i className="fas fa-sign-in-alt me-2"></i>
                                                Ingresar
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>
                                                Ingresando...
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 