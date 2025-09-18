import React from 'react';
import './badge.css';

/**
 * Badge Component - Componente genérico y reutilizable para mostrar badges
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.text - Texto a mostrar en el badge
 * @param {string} props.variant - Variante de color del badge (primary, secondary, success, danger, warning, info, light, dark)
 * @param {string} props.size - Tamaño del badge (sm, md, lg)
 * @param {string} props.icon - Clase de icono FontAwesome a mostrar
 * @param {boolean} props.clickable - Si el badge es clickeable
 * @param {function} props.onClick - Función a ejecutar al hacer clic
 * @param {string} props.title - Texto del tooltip
 * @param {string} props.className - Clases CSS adicionales
 * @param {Object} props.style - Estilos inline adicionales
 * @param {boolean} props.outline - Si usar variante outline
 * @param {boolean} props.rounded - Si usar bordes redondeados
 * @param {string} props.iconPosition - Posición del icono (left, right)
 * @returns {JSX.Element} Componente Badge
 */
const Badge = ({
    text = '',
    variant = 'primary',
    size = 'md',
    icon = null,
    clickable = false,
    onClick = null,
    title = '',
    className = '',
    style = {},
    outline = false,
    rounded = true,
    iconPosition = 'left'
}) => {
    // Construir clases CSS
    const getVariantClass = () => {
        if (outline) {
            return `badge-outline-${variant}`;
        }
        return `badge-${variant}`;
    };

    const getSizeClass = () => {
        return `badge-${size}`;
    };

    const getRoundedClass = () => {
        return rounded ? 'badge-rounded' : 'badge-square';
    };

    const getClickableClass = () => {
        return clickable ? 'badge-clickable' : '';
    };

    const badgeClasses = [
        'badge',
        getVariantClass(),
        getSizeClass(),
        getRoundedClass(),
        getClickableClass(),
        className
    ].filter(Boolean).join(' ');

    // Manejar clic
    const handleClick = (e) => {
        if (clickable && onClick) {
            e.stopPropagation();
            onClick(e);
        }
    };

    // Renderizar icono
    const renderIcon = () => {
        if (!icon) return null;
        
        const iconClass = `fas ${icon} ${iconPosition === 'left' ? 'me-1' : 'ms-1'}`;
        return <i className={iconClass}></i>;
    };

    // Renderizar contenido
    const renderContent = () => {
        if (iconPosition === 'right') {
            return (
                <>
                    {text}
                    {renderIcon()}
                </>
            );
        }
        
        return (
            <>
                {renderIcon()}
                {text}
            </>
        );
    };

    return (
        <span
            className={badgeClasses}
            style={{
                cursor: clickable ? 'pointer' : 'default',
                ...style
            }}
            onClick={handleClick}
            title={title}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e);
                }
            } : undefined}
        >
            {renderContent()}
        </span>
    );
};

export default Badge;
