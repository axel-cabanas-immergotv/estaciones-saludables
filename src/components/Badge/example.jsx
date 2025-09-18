import React from 'react';
import Badge from './index';

// Ejemplo de uso del componente Badge
const BadgeExample = () => {
    // Datos de ejemplo para fiscales
    const fiscalesGenerales = [
        {
            user: {
                first_name: 'Juan',
                last_name: 'Pérez',
                id: 1
            }
        },
        {
            user: {
                first_name: 'María',
                last_name: 'González',
                id: 2
            }
        }
    ];

    // Handler para clic en fiscal
    const handleFiscalClick = (user) => {
        console.log('Fiscal clicked:', user);
        // Aquí iría la lógica para mostrar detalles del fiscal
    };

    return (
        <div className="p-4">
            <h2>Ejemplos del Componente Badge</h2>
            
            {/* Ejemplo original migrado */}
            <div className="mb-4">
                <h3>Fiscales Generales (Ejemplo Original)</h3>
                <div className="d-flex flex-wrap gap-1">
                    {fiscalesGenerales.map((fiscal, index) => (
                        <Badge
                            key={index}
                            text={`${fiscal.user.first_name} ${fiscal.user.last_name}`}
                            variant="success"
                            icon="fa-user-tie"
                            clickable={true}
                            onClick={() => handleFiscalClick(fiscal.user)}
                            title="Click para ver detalles del fiscal general"
                        />
                    ))}
                </div>
            </div>

            {/* Variantes de color */}
            <div className="mb-4">
                <h3>Variantes de Color</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge text="Primary" variant="primary" />
                    <Badge text="Secondary" variant="secondary" />
                    <Badge text="Success" variant="success" />
                    <Badge text="Danger" variant="danger" />
                    <Badge text="Warning" variant="warning" />
                    <Badge text="Info" variant="info" />
                    <Badge text="Light" variant="light" />
                    <Badge text="Dark" variant="dark" />
                </div>
            </div>

            {/* Variantes outline */}
            <div className="mb-4">
                <h3>Variantes Outline</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge text="Primary" variant="primary" outline={true} />
                    <Badge text="Secondary" variant="secondary" outline={true} />
                    <Badge text="Success" variant="success" outline={true} />
                    <Badge text="Danger" variant="danger" outline={true} />
                    <Badge text="Warning" variant="warning" outline={true} />
                    <Badge text="Info" variant="info" outline={true} />
                    <Badge text="Light" variant="light" outline={true} />
                    <Badge text="Dark" variant="dark" outline={true} />
                </div>
            </div>

            {/* Tamaños */}
            <div className="mb-4">
                <h3>Tamaños</h3>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <Badge text="Pequeño" variant="primary" size="sm" />
                    <Badge text="Mediano" variant="primary" size="md" />
                    <Badge text="Grande" variant="primary" size="lg" />
                </div>
            </div>

            {/* Con iconos */}
            <div className="mb-4">
                <h3>Con Iconos</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge text="Usuario" variant="primary" icon="fa-user" />
                    <Badge text="Editar" variant="warning" icon="fa-edit" />
                    <Badge text="Eliminar" variant="danger" icon="fa-trash" />
                    <Badge text="Ver" variant="info" icon="fa-eye" />
                    <Badge text="Guardar" variant="success" icon="fa-save" />
                </div>
            </div>

            {/* Clickeables */}
            <div className="mb-4">
                <h3>Badges Clickeables</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge 
                        text="Click me" 
                        variant="primary" 
                        clickable={true}
                        onClick={() => alert('¡Badge clickeado!')}
                    />
                    <Badge 
                        text="Editar" 
                        variant="warning" 
                        icon="fa-edit"
                        clickable={true}
                        onClick={() => alert('Editando...')}
                    />
                    <Badge 
                        text="Eliminar" 
                        variant="danger" 
                        icon="fa-trash"
                        clickable={true}
                        onClick={() => alert('Eliminando...')}
                    />
                </div>
            </div>

            {/* Estados de usuario */}
            <div className="mb-4">
                <h3>Estados de Usuario</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge 
                        text="Activo" 
                        variant="success" 
                        icon="fa-check-circle" 
                    />
                    <Badge 
                        text="Inactivo" 
                        variant="secondary" 
                        icon="fa-times-circle" 
                    />
                    <Badge 
                        text="Pendiente" 
                        variant="warning" 
                        icon="fa-clock" 
                    />
                    <Badge 
                        text="Bloqueado" 
                        variant="danger" 
                        icon="fa-ban" 
                    />
                </div>
            </div>

            {/* Casos de uso específicos */}
            <div className="mb-4">
                <h3>Casos de Uso Específicos</h3>
                <div className="d-flex flex-wrap gap-2">
                    <Badge 
                        text="Fiscal General" 
                        variant="success" 
                        icon="fa-user-tie"
                        clickable={true}
                        onClick={() => console.log('Ver fiscal general')}
                        title="Click para ver detalles del fiscal general"
                    />
                    <Badge 
                        text="Mesa 123" 
                        variant="info" 
                        icon="fa-table"
                        clickable={true}
                        onClick={() => console.log('Ver mesa 123')}
                    />
                    <Badge 
                        text="Escuela ABC" 
                        variant="primary" 
                        icon="fa-school"
                        clickable={true}
                        onClick={() => console.log('Ver escuela ABC')}
                    />
                </div>
            </div>
        </div>
    );
};

export default BadgeExample;
