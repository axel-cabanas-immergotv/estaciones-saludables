import React, { useState } from 'react';
import SelectWrapper from './index.jsx';
import './selectWrapper.css';

const SelectWrapperExample = () => {
    // Estados para diferentes tipos de selects
    const [singleValue, setSingleValue] = useState(null);
    const [multiValue, setMultiValue] = useState([]);
    const [searchValue, setSearchValue] = useState(null);
    const [themeValue, setThemeValue] = useState(null);
    const [customValue, setCustomValue] = useState(null);
    const [errorValue, setErrorValue] = useState(null);
    const [apiValue, setApiValue] = useState(null);
    const [nonSearchableValue, setNonSearchableValue] = useState(null);
    
    // Opciones de ejemplo
    const basicOptions = [
        { value: 'admin', label: 'Administrador' },
        { value: 'manager', label: 'Gerente' },
        { value: 'user', label: 'Usuario' },
        { value: 'guest', label: 'Invitado' }
    ];
    
    const cityOptions = [
        { value: 'bsas', label: 'Buenos Aires' },
        { value: 'cordoba', label: 'Córdoba' },
        { value: 'rosario', label: 'Rosario' },
        { value: 'mendoza', label: 'Mendoza' },
        { value: 'laplata', label: 'La Plata' }
    ];
    
    const roleOptions = [
        { value: 'developer', label: 'Desarrollador' },
        { value: 'designer', label: 'Diseñador' },
        { value: 'pm', label: 'Project Manager' },
        { value: 'qa', label: 'QA Tester' }
    ];
    
    // Simular función de carga de opciones por API
    const simulateApiLoad = async (inputValue, { action }) => {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (action === 'load-all') {
            // Retornar todas las opciones sin límite
            return [
                { value: 'user1', label: 'Usuario 1' },
                { value: 'user2', label: 'Usuario 2' },
                { value: 'user3', label: 'Usuario 3' },
                { value: 'user4', label: 'Usuario 4' },
                { value: 'user5', label: 'Usuario 5' },
                { value: 'user6', label: 'Usuario 6' },
                { value: 'user7', label: 'Usuario 7' },
                { value: 'user8', label: 'Usuario 8' },
                { value: 'user9', label: 'Usuario 9' },
                { value: 'user10', label: 'Usuario 10' },
                { value: 'user11', label: 'Usuario 11' },
                { value: 'user12', label: 'Usuario 12' },
                { value: 'user13', label: 'Usuario 13' },
                { value: 'user14', label: 'Usuario 14' },
                { value: 'user15', label: 'Usuario 15' }
            ];
        }
        
        // Búsqueda normal con filtrado
        if (inputValue) {
            return [
                { value: 'user1', label: 'Usuario 1' },
                { value: 'user2', label: 'Usuario 2' },
                { value: 'user3', label: 'Usuario 3' }
            ].filter(user => 
                user.label.toLowerCase().includes(inputValue.toLowerCase())
            );
        }
        
        return [];
    };
    
    // Estilos personalizados
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#f8f9fa',
            borderColor: state.isFocused ? '#007bff' : '#dee2e6',
            borderRadius: '20px',
            padding: '8px 16px',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 123, 255, 0.25)' : 'none'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#007bff' : 'transparent',
            color: state.isSelected ? 'white' : '#333',
            borderRadius: '8px',
            margin: '2px 8px',
            '&:hover': {
                backgroundColor: state.isSelected ? '#007bff' : '#e9ecef'
            }
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
        })
    };
    
    // Simular búsqueda remota
    const handleSearch = (inputValue) => {
        console.log('Buscando:', inputValue);
        // Aquí normalmente harías una llamada a la API
    };
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>SelectWrapper - Ejemplos de Uso</h1>
            <p>Este componente demuestra todas las funcionalidades del SelectWrapper.</p>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>1. Select Básico</h2>
                <SelectWrapper
                    options={basicOptions}
                    value={singleValue}
                    onChange={setSingleValue}
                    placeholder="Selecciona un rol"
                    label="Rol de Usuario"
                    helpText="Selecciona el rol que tendrá este usuario en el sistema"
                    required
                />
                <p><strong>Valor seleccionado:</strong> {singleValue ? singleValue.label : 'Ninguno'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>2. Select Múltiple</h2>
                <SelectWrapper
                    options={cityOptions}
                    value={multiValue}
                    onChange={setMultiValue}
                    isMulti
                    placeholder="Selecciona ciudades..."
                    label="Ciudades de Interés"
                    helpText="Puedes seleccionar múltiples ciudades"
                />
                <p><strong>Ciudades seleccionadas:</strong> {multiValue.length > 0 ? multiValue.map(v => v.label).join(', ') : 'Ninguna'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>3. Select con Búsqueda</h2>
                <SelectWrapper
                    options={roleOptions}
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Escribe para buscar..."
                    label="Buscar Rol"
                    helpText="Escribe para filtrar las opciones disponibles"
                    onInputChange={handleSearch}
                    isSearchable
                />
                <p><strong>Rol seleccionado:</strong> {searchValue ? searchValue.label : 'Ninguno'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>4. Select con Tema Minimal</h2>
                <SelectWrapper
                    options={basicOptions}
                    value={themeValue}
                    onChange={setThemeValue}
                    placeholder="Selecciona una opción"
                    label="Select Minimal"
                    theme="minimal"
                    helpText="Este select usa el tema minimal con solo borde inferior"
                />
                <p><strong>Valor seleccionado:</strong> {themeValue ? themeValue.label : 'Ninguno'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>5. Select con Estilos Personalizados</h2>
                <SelectWrapper
                    options={cityOptions}
                    value={customValue}
                    onChange={setCustomValue}
                    placeholder="Selecciona una ciudad"
                    label="Select Personalizado"
                    customStyles={customStyles}
                    helpText="Este select tiene estilos completamente personalizados"
                />
                <p><strong>Ciudad seleccionada:</strong> {customValue ? customValue.label : 'Ninguna'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>6. Select con Manejo de Errores</h2>
                <SelectWrapper
                    options={basicOptions}
                    value={errorValue}
                    onChange={setErrorValue}
                    placeholder="Selecciona una opción"
                    label="Campo con Error"
                    required
                    hasError={true}
                    errorMessage="Este campo es requerido y debe ser seleccionado"
                    helpText="Este select muestra cómo se manejan los errores"
                />
                <p><strong>Valor seleccionado:</strong> {errorValue ? errorValue.label : 'Ninguno'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>7. Select Deshabilitado</h2>
                <SelectWrapper
                    options={basicOptions}
                    value={singleValue}
                    onChange={setSingleValue}
                    placeholder="No disponible"
                    label="Select Deshabilitado"
                    isDisabled={true}
                    helpText="Este select está deshabilitado y no se puede usar"
                />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>8. Select con Loading</h2>
                <SelectWrapper
                    options={[]}
                    value={null}
                    onChange={() => {}}
                    placeholder="Cargando opciones..."
                    label="Select con Loading"
                    isLoading={true}
                    helpText="Este select simula estar cargando opciones"
                />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>9. Select sin Opciones</h2>
                <SelectWrapper
                    options={[]}
                    value={null}
                    onChange={() => {}}
                    placeholder="No hay opciones"
                    label="Select sin Opciones"
                    noOptionsMessage="No hay opciones disponibles en este momento"
                    helpText="Este select no tiene opciones disponibles"
                />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>10. Select con Callbacks</h2>
                <SelectWrapper
                    options={basicOptions}
                    value={singleValue}
                    onChange={setSingleValue}
                    placeholder="Selecciona una opción"
                    label="Select con Callbacks"
                    onFocus={() => console.log('Select enfocado')}
                    onBlur={() => console.log('Select perdió el foco')}
                    onMenuOpen={() => console.log('Menú abierto')}
                    onMenuClose={() => console.log('Menú cerrado')}
                    helpText="Abre la consola para ver los callbacks en acción"
                />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>11. Select con Carga por API (Búsqueda)</h2>
                <SelectWrapper
                    options={[]}
                    value={apiValue}
                    onChange={setApiValue}
                    placeholder="Escribe para buscar usuarios..."
                    label="Buscar Usuarios por API"
                    helpText="Este select carga opciones desde una API simulada al escribir"
                    loadOptions={simulateApiLoad}
                    isSearchable={true}
                />
                <p><strong>Usuario seleccionado:</strong> {apiValue ? apiValue.label : 'Ninguno'}</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>12. Select con Carga por API (Sin Búsqueda - Precarga Todo)</h2>
                <SelectWrapper
                    options={[]}
                    value={nonSearchableValue}
                    onChange={setNonSearchableValue}
                    placeholder="Selecciona un usuario..."
                    label="Usuarios Precargados"
                    helpText="Este select precarga TODAS las opciones sin límite cuando isSearchable es false"
                    loadOptions={simulateApiLoad}
                    isSearchable={false}
                    loadAllOnMount={true}
                    defaultOptions={[
                        { value: 'default1', label: 'Usuario por Defecto 1' },
                        { value: 'default2', label: 'Usuario por Defecto 2' }
                    ]}
                />
                <p><strong>Usuario seleccionado:</strong> {nonSearchableValue ? nonSearchableValue.label : 'Ninguno'}</p>
                <p><em>Nota: Al abrir el menú o hacer click, se cargarán todas las opciones desde la API</em></p>
            </div>
            
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginTop: '40px' 
            }}>
                <h3>Resumen de Funcionalidades</h3>
                <ul>
                    <li>✅ Select simple y múltiple</li>
                    <li>✅ Búsqueda y filtrado</li>
                    <li>✅ Temas personalizables</li>
                    <li>✅ Estilos personalizados</li>
                    <li>✅ Manejo de errores</li>
                    <li>✅ Estados de loading y disabled</li>
                    <li>✅ Callbacks personalizables</li>
                    <li>✅ Labels y textos de ayuda</li>
                    <li>✅ Campos requeridos</li>
                    <li>✅ Responsivo y accesible</li>
                    <li>✅ <strong>NUEVO:</strong> Carga de opciones por API</li>
                    <li>✅ <strong>NUEVO:</strong> Precarga de todas las opciones cuando isSearchable es false</li>
                    <li>✅ <strong>NUEVO:</strong> Opciones por defecto mientras se cargan las de la API</li>
                </ul>
            </div>
            
            <div style={{ 
                backgroundColor: '#e3f2fd', 
                padding: '20px', 
                borderRadius: '8px', 
                marginTop: '20px' 
            }}>
                <h3>Nueva Funcionalidad: Carga por API</h3>
                <p><strong>Props agregadas:</strong></p>
                <ul>
                    <li><code>loadOptions</code>: Función que retorna una promesa con las opciones</li>
                    <li><code>loadAllOnMount</code>: Si cargar todas las opciones al montar el componente</li>
                    <li><code>defaultOptions</code>: Opciones por defecto mientras se cargan las de la API</li>
                </ul>
                <p><strong>Comportamiento:</strong></p>
                <ul>
                    <li>Cuando <code>isSearchable={false}</code> y se proporciona <code>loadOptions</code>, se precargan TODAS las opciones</li>
                    <li>Las opciones se cargan al abrir el menú o al hacer click en el select</li>
                    <li>Se puede usar <code>loadAllOnMount={true}</code> para cargar opciones inmediatamente</li>
                    <li>Se muestran <code>defaultOptions</code> mientras se cargan las opciones de la API</li>
                </ul>
            </div>
        </div>
    );
};

export default SelectWrapperExample;
