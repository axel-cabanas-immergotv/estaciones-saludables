import React from 'react';
import './search.css';

const Search = ({
    // Configuración de búsqueda
    enableSearch = false,
    searchTerm = '',
    searchPlaceholder = 'Buscar...',
    onSearchChange = null,
    onSearchExecute = null, // Nueva prop para ejecutar búsqueda
    onClearSearch = null,
    
    // Configuración de filtros
    filterOptions = [],
    filters = {},
    onFilterChange = null,
    
    // Configuración de comportamiento
    autoSearch = false, // Nueva prop para controlar búsqueda automática
    
    // Configuración de layout
    searchColumnSize = 'col-6',
    searchButtonColumnSize = 'd-inline-block w-auto',
    clearButtonColumnSize = 'd-inline-block w-auto',
    filterColumnSize = 'col-md-3',
    
    // Personalización
    className = '',
    showCard = true,
    cardClassName = 'card mb-4'
}) => {
    
    // Función para manejar el cambio de texto en el campo de búsqueda
    const handleSearchChange = (e) => {
        const value = e.target.value;
        
        // Siempre actualizar el valor del campo (para la UI)
        if (onSearchChange) {
            onSearchChange(value);
        }
        
        // Solo ejecutar búsqueda automática si autoSearch está habilitado
        if (autoSearch && onSearchExecute) {
            onSearchExecute(value, filters);
        }
    };
    
    // Función para manejar el clic del botón de búsqueda
    const handleSearchClick = () => {
        if (onSearchExecute) {
            onSearchExecute(searchTerm, filters);
        }
    };
    
    // Función para manejar limpiar búsqueda
    const handleClearSearch = () => {
        if (onClearSearch) {
            onClearSearch();
        }
        // Ejecutar búsqueda vacía inmediatamente al limpiar
        if (onSearchExecute) {
            onSearchExecute('', {});
        }
    };
    
    // Función para manejar teclas en la búsqueda
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (onSearchExecute) {
                onSearchExecute(searchTerm, filters);
            }
        }
    };
    
    // Función para manejar cambio de filtros
    const handleFilterChange = (field, value) => {
        if (onFilterChange) {
            onFilterChange(field, value);
        }
        // Los filtros se ejecutan inmediatamente
        if (onSearchExecute) {
            const newFilters = { ...filters };
            if (value) {
                newFilters[field] = value;
            } else {
                delete newFilters[field];
            }
            onSearchExecute(searchTerm, newFilters);
        }
    };
    
    // Si no hay búsqueda ni filtros habilitados, no renderizar nada
    if (!enableSearch && !filterOptions.length) {
        return null;
    }
    
    // Renderizar contenido de búsqueda y filtros
    const renderContent = () => (
        <div className={`row g-3 ${className}`}>
            {/* Campo de búsqueda */}
            {enableSearch && (
                <>
                    <div className={searchColumnSize}>
                        <input
                            type="text"
                            className="form-control search-input"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                    </div>
                    
                    {/* Botón de búsqueda */}
                    <div className={searchButtonColumnSize}>
                        <button 
                            type="button" 
                            className="btn btn-outline-primary search-button"
                            onClick={handleSearchClick}
                            title="Buscar"
                        >
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                    
                    {/* Botón de limpiar */}
                    <div className={clearButtonColumnSize}>
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary clear-button"
                            onClick={handleClearSearch}
                            title="Limpiar búsqueda"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </>
            )}
            
            {/* Filtros */}
            {filterOptions.length > 0 && filterOptions.map((filter) => (
                <div key={filter.field} className={filterColumnSize}>
                    <select
                        className="form-select filter-select"
                        value={filters[filter.field] || ''}
                        onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                    >
                        <option value="">
                            {filter.placeholder || `Todos ${filter.label}`}
                        </option>
                        {filter.options && filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
    
    // Renderizar con o sin card
    if (showCard) {
        return (
            <div className={cardClassName}>
                <div className="card-body">
                    {renderContent()}
                </div>
            </div>
        );
    }
    
    return (
        <div className="search-component">
            {renderContent()}
        </div>
    );
};

export default Search;
