import React, { useState } from 'react';
import Search from './index';

// Ejemplo de uso del componente Search
const SearchExample = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    
    // Configuración de filtros de ejemplo
    const filterOptions = [
        {
            field: 'category',
            label: 'Categoría',
            placeholder: 'Todas las categorías',
            options: [
                { value: 'tech', label: 'Tecnología' },
                { value: 'design', label: 'Diseño' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'business', label: 'Negocios' }
            ]
        },
        {
            field: 'status',
            label: 'Estado',
            placeholder: 'Todos los estados',
            options: [
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
                { value: 'pending', label: 'Pendiente' }
            ]
        },
        {
            field: 'priority',
            label: 'Prioridad',
            placeholder: 'Todas las prioridades',
            options: [
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' }
            ]
        }
    ];
    
    // Handlers
    const handleSearchChange = (term) => {
        setSearchTerm(term);
        console.log('Search term changed (UI only):', term);
        // Solo actualiza la UI, no ejecuta búsqueda
    };
    
    const handleSearchExecute = (term, filters) => {
        console.log('Ejecutando búsqueda:', term, filters);
        // Aquí iría la lógica de búsqueda real
        // Solo se ejecuta al hacer clic en buscar o presionar Enter
    };
    
    const handleClearSearch = () => {
        setSearchTerm('');
        setFilters({});
        console.log('Search cleared');
        // Se ejecuta automáticamente al limpiar
    };
    
    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters };
        if (value) {
            newFilters[field] = value;
        } else {
            delete newFilters[field];
        }
        setFilters(newFilters);
        console.log('Filters changed:', newFilters);
        // Aquí iría la lógica de filtrado
    };
    
    return (
        <div className="container mt-4">
            <h2>Ejemplo del Componente Search</h2>
            
            {/* Ejemplo 1: Búsqueda completa con filtros */}
            <div className="mb-5">
                <h4>Búsqueda Completa con Filtros</h4>
                <Search
                    enableSearch={true}
                    searchTerm={searchTerm}
                    searchPlaceholder="Buscar productos, servicios... (clic en buscar o Enter)"
                    onSearchChange={handleSearchChange}
                    onSearchExecute={handleSearchExecute}
                    onClearSearch={handleClearSearch}
                    filterOptions={filterOptions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    autoSearch={false} // Búsqueda manual
                />
            </div>
            
            {/* Ejemplo 2: Solo búsqueda */}
            <div className="mb-5">
                <h4>Solo Búsqueda (sin filtros)</h4>
                <Search
                    enableSearch={true}
                    searchTerm={searchTerm}
                    searchPlaceholder="Buscar usuarios (manual)..."
                    onSearchChange={handleSearchChange}
                    onSearchExecute={handleSearchExecute}
                    onClearSearch={handleClearSearch}
                    autoSearch={false}
                    showCard={false}
                />
            </div>
            
            {/* Ejemplo 3: Solo filtros */}
            <div className="mb-5">
                <h4>Solo Filtros (sin búsqueda)</h4>
                <Search
                    filterOptions={filterOptions.slice(0, 2)} // Solo los primeros 2 filtros
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    cardClassName="card border-primary mb-3"
                />
            </div>
            
            {/* Ejemplo 4: Búsqueda automática */}
            <div className="mb-5">
                <h4>Búsqueda Automática (Legacy)</h4>
                <p className="text-muted">Esta búsqueda se ejecuta mientras escribes:</p>
                <Search
                    enableSearch={true}
                    searchTerm={searchTerm}
                    searchPlaceholder="Búsqueda automática mientras escribes..."
                    onSearchChange={handleSearchChange}
                    onSearchExecute={handleSearchExecute}
                    onClearSearch={handleClearSearch}
                    autoSearch={true} // Búsqueda automática
                    showCard={false}
                />
            </div>
            
            {/* Ejemplo 5: Layout personalizado */}
            <div className="mb-5">
                <h4>Layout Personalizado</h4>
                <Search
                    enableSearch={true}
                    searchTerm={searchTerm}
                    searchPlaceholder="Búsqueda personalizada..."
                    onSearchChange={handleSearchChange}
                    onSearchExecute={handleSearchExecute}
                    onClearSearch={handleClearSearch}
                    searchColumnSize="col-md-6"
                    searchButtonColumnSize="col-md-3"
                    clearButtonColumnSize="col-md-3"
                    filterOptions={[filterOptions[0]]} // Solo un filtro
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    filterColumnSize="col-md-6"
                    autoSearch={false}
                />
            </div>
            
            {/* Mostrar estado actual */}
            <div className="card">
                <div className="card-header">
                    <h5>Estado Actual</h5>
                </div>
                <div className="card-body">
                    <p><strong>Término de búsqueda:</strong> {searchTerm || 'Vacío'}</p>
                    <p><strong>Filtros activos:</strong></p>
                    <pre>{JSON.stringify(filters, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
};

export default SearchExample;
