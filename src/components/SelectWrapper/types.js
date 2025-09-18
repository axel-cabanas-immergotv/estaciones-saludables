/**
 * Tipos para el componente SelectWrapper
 * Estos tipos definen la estructura de datos esperada
 */

/**
 * Estructura de una opción del select
 * @typedef {Object} SelectOption
 * @property {string|number} value - Valor único de la opción
 * @property {string} label - Texto visible de la opción
 * @property {boolean} [isDisabled] - Si la opción está deshabilitada
 * @property {string} [description] - Descripción adicional de la opción
 * @property {string} [icon] - Icono de la opción
 */
export const SelectOptionShape = {
    value: 'string|number',
    label: 'string',
    isDisabled: 'boolean?',
    description: 'string?',
    icon: 'string?'
};

/**
 * Estado del select
 * @typedef {Object} SelectState
 * @property {boolean} isFocused - Si el select tiene el foco
 * @property {boolean} isOpen - Si el menú está abierto
 * @property {boolean} isSelected - Si hay una opción seleccionada
 */
export const SelectStateShape = {
    isFocused: 'boolean',
    isOpen: 'boolean',
    isSelected: 'boolean'
};

/**
 * Meta información de las acciones del select
 * @typedef {Object} ActionMeta
 * @property {string} action - Tipo de acción realizada
 * @property {string} [name] - Nombre del campo
 * @property {boolean} [removedValue] - Valor removido (si aplica)
 * @property {boolean} [removedValues] - Valores removidos (si aplica)
 */
export const ActionMetaShape = {
    action: 'string',
    name: 'string?',
    removedValue: 'boolean?',
    removedValues: 'boolean?'
};

/**
 * Función para cargar opciones desde API
 * @typedef {Function} LoadOptionsFunction
 * @param {string} inputValue - Valor del input de búsqueda
 * @param {ActionMeta} meta - Meta información de la acción
 * @returns {Promise<SelectOption[]>} - Promesa que resuelve a las opciones
 */
export const LoadOptionsFunctionShape = {
    inputValue: 'string',
    meta: 'ActionMeta',
    return: 'Promise<SelectOption[]>'
};

/**
 * Estilos personalizados para react-select
 * @typedef {Object} CustomStyles
 * @property {Function} [control] - Estilos para el control principal
 * @property {Function} [option] - Estilos para las opciones
 * @property {Function} [menu] - Estilos para el menú
 * @property {Function} [multiValue] - Estilos para valores múltiples
 * @property {Function} [placeholder] - Estilos para el placeholder
 * @property {Function} [singleValue] - Estilos para valor único
 * @property {Function} [input] - Estilos para el input
 * @property {Function} [indicator] - Estilos para los indicadores
 */
export const CustomStylesShape = {
    control: 'Function?',
    option: 'Function?',
    menu: 'Function?',
    multiValue: 'Function?',
    placeholder: 'Function?',
    singleValue: 'Function?',
    input: 'Function?',
    indicator: 'Function?'
};

/**
 * Componentes personalizados para react-select
 * @typedef {Object} CustomComponents
 * @property {React.Component} [Option] - Componente personalizado para opciones
 * @property {React.Component} [SingleValue] - Componente personalizado para valor único
 * @property {React.Component} [MultiValue] - Componente personalizado para valores múltiples
 * @property {React.Component} [Menu] - Componente personalizado para el menú
 * @property {React.Component} [Control] - Componente personalizado para el control
 */
export const CustomComponentsShape = {
    Option: 'React.Component?',
    SingleValue: 'React.Component?',
    MultiValue: 'React.Component?',
    Menu: 'React.Component?',
    Control: 'React.Component?'
};

/**
 * Props del componente SelectWrapper
 * @typedef {Object} SelectWrapperProps
 * @property {SelectOption[]} [options] - Array de opciones disponibles
 * @property {SelectOption|SelectOption[]|null} [value] - Valor seleccionado
 * @property {Function} [onChange] - Función llamada al cambiar la selección
 * @property {string} [placeholder] - Texto del placeholder
 * @property {boolean} [isDisabled] - Si el select está deshabilitado
 * @property {boolean} [isLoading] - Si está cargando opciones
 * @property {boolean} [isMulti] - Si permite selección múltiple
 * @property {boolean} [isClearable] - Si permite limpiar la selección
 * @property {boolean} [isSearchable] - Si permite buscar en las opciones
 * @property {Function} [onInputChange] - Función llamada al cambiar el input
 * @property {Function} [filterOption] - Función personalizada para filtrar
 * @property {Function|string} [noOptionsMessage] - Mensaje cuando no hay opciones
 * @property {LoadOptionsFunction} [loadOptions] - Función para cargar opciones desde API
 * @property {boolean} [loadAllOnMount] - Si cargar todas las opciones al montar el componente
 * @property {SelectOption[]} [defaultOptions] - Opciones por defecto cuando no hay opciones cargadas
 * @property {string} [className] - Clase CSS adicional
 * @property {CustomStyles} [customStyles] - Estilos personalizados
 * @property {'default'|'minimal'} [theme] - Tema del select
 * @property {boolean} [closeMenuOnSelect] - Si cerrar menú al seleccionar
 * @property {boolean} [blurInputOnSelect] - Si hacer blur del input al seleccionar
 * @property {boolean} [captureMenuScroll] - Si capturar scroll del menú
 * @property {boolean} [hideSelectedOptions] - Si ocultar opciones seleccionadas
 * @property {Function} [onBlur] - Función llamada al perder el foco
 * @property {Function} [onFocus] - Función llamada al obtener el foco
 * @property {Function} [onMenuOpen] - Función llamada al abrir el menú
 * @property {Function} [onMenuClose] - Función llamada al cerrar el menú
 * @property {CustomComponents} [components] - Componentes personalizados
 * @property {boolean} [hasError] - Si el select tiene un error
 * @property {string} [errorMessage] - Mensaje de error a mostrar
 * @property {string} [label] - Label del select
 * @property {string} [helpText] - Texto de ayuda
 * @property {boolean} [required] - Si el campo es requerido
 */
export const SelectWrapperPropsShape = {
    // Basic props
    options: 'SelectOption[]',
    value: 'SelectOption|SelectOption[]|null',
    onChange: 'Function',
    placeholder: 'string?',
    isDisabled: 'boolean?',
    isLoading: 'boolean?',
    
    // Selection props
    isMulti: 'boolean?',
    isClearable: 'boolean?',
    isSearchable: 'boolean?',
    
    // Search props
    onInputChange: 'Function?',
    filterOption: 'Function?',
    noOptionsMessage: 'Function|string?',
    
    // API loading props
    loadOptions: 'LoadOptionsFunction?',
    loadAllOnMount: 'boolean?',
    defaultOptions: 'SelectOption[]?',
    
    // Styling props
    className: 'string?',
    customStyles: 'CustomStyles?',
    theme: "'default'|'minimal'?",
    
    // Advanced props
    closeMenuOnSelect: 'boolean?',
    blurInputOnSelect: 'boolean?',
    captureMenuScroll: 'boolean?',
    hideSelectedOptions: 'boolean?',
    
    // Callbacks
    onBlur: 'Function?',
    onFocus: 'Function?',
    onMenuOpen: 'Function?',
    onMenuClose: 'Function?',
    
    // Custom components
    components: 'CustomComponents?',
    
    // Error handling
    hasError: 'boolean?',
    errorMessage: 'string?',
    
    // UI props
    label: 'string?',
    helpText: 'string?',
    required: 'boolean?'
};

/**
 * Valores por defecto del componente
 */
export const DEFAULT_PROPS = {
    options: [],
    placeholder: 'Seleccionar...',
    isDisabled: false,
    isLoading: false,
    isMulti: false,
    isClearable: true,
    isSearchable: true,
    noOptionsMessage: () => 'No hay opciones disponibles',
    loadAllOnMount: false,
    defaultOptions: [],
    className: '',
    customStyles: {},
    theme: 'default',
    closeMenuOnSelect: true,
    blurInputOnSelect: true,
    captureMenuScroll: true,
    hideSelectedOptions: false,
    hasError: false,
    errorMessage: '',
    required: false
};

/**
 * Temas disponibles para el select
 */
export const THEMES = {
    DEFAULT: 'default',
    MINIMAL: 'minimal'
};

/**
 * Estados del select
 */
export const SELECT_STATES = {
    IDLE: 'idle',
    FOCUSED: 'focused',
    OPEN: 'open',
    LOADING: 'loading',
    ERROR: 'error',
    DISABLED: 'disabled'
};

/**
 * Acciones disponibles del select
 */
export const SELECT_ACTIONS = {
    SELECT_OPTION: 'select-option',
    DESELECT_OPTION: 'deselect-option',
    REMOVE_VALUE: 'remove-value',
    POP_VALUE: 'pop-value',
    SET_VALUE: 'set-value',
    CLEAR: 'clear',
    CREATE_OPTION: 'create-option'
};

/**
 * Validación de props
 * @param {SelectWrapperProps} props - Props a validar
 * @returns {boolean} - Si las props son válidas
 */
export const validateProps = (props) => {
    const requiredProps = ['onChange'];
    
    for (const prop of requiredProps) {
        if (!props[prop]) {
            console.error(`SelectWrapper: Prop requerida '${prop}' no proporcionada`);
            return false;
        }
    }
    
    if (props.options && !Array.isArray(props.options)) {
        console.error('SelectWrapper: Prop "options" debe ser un array');
        return false;
    }
    
    if (props.isMulti && !Array.isArray(props.value) && props.value !== null) {
        console.warn('SelectWrapper: Con isMulti=true, el valor debería ser un array');
    }
    
    return true;
};

/**
 * Normalización de opciones
 * @param {any} options - Opciones a normalizar
 * @returns {SelectOption[]} - Opciones normalizadas
 */
export const normalizeOptions = (options) => {
    if (!Array.isArray(options)) {
        return [];
    }
    
    return options.map(option => {
        if (typeof option === 'string') {
            return { value: option, label: option };
        }
        
        if (typeof option === 'number') {
            return { value: option, label: String(option) };
        }
        
        if (option && typeof option === 'object') {
            return {
                value: option.value ?? option.id ?? option.key,
                label: option.label ?? option.name ?? option.text ?? String(option.value),
                isDisabled: option.isDisabled ?? option.disabled ?? false,
                description: option.description ?? option.desc ?? '',
                icon: option.icon ?? option.avatar ?? ''
            };
        }
        
        return null;
    }).filter(Boolean);
};

/**
 * Normalización del valor
 * @param {any} value - Valor a normalizar
 * @param {boolean} isMulti - Si es selección múltiple
 * @returns {SelectOption|SelectOption[]|null} - Valor normalizado
 */
export const normalizeValue = (value, isMulti = false) => {
    if (value === null || value === undefined) {
        return isMulti ? [] : null;
    }
    
    if (isMulti) {
        if (Array.isArray(value)) {
            return value.map(normalizeValue, false);
        }
        return [normalizeValue(value, false)];
    }
    
    return normalizeOptions([value])[0] || null;
};

export default {
    SelectOptionShape,
    SelectStateShape,
    ActionMetaShape,
    LoadOptionsFunctionShape,
    CustomStylesShape,
    CustomComponentsShape,
    SelectWrapperPropsShape,
    DEFAULT_PROPS,
    THEMES,
    SELECT_STATES,
    SELECT_ACTIONS,
    validateProps,
    normalizeOptions,
    normalizeValue
};
