# Affiliate Auto-Refresh System

## Overview

El sistema de refresco automático de affiliates permite que todas las tablas de entidades se actualicen automáticamente cuando el usuario cambia de affiliate, asegurando que los datos mostrados correspondan siempre al affiliate seleccionado.

## How It Works

### 1. Affiliate Context Event

Cuando se cambia de affiliate en el `AffiliateContext`, se dispara un evento personalizado:

```javascript
// In AffiliateContext.jsx - switchAffiliate function
window.dispatchEvent(new CustomEvent('affiliateChanged', { 
    detail: { affiliateId } 
}));
```

### 2. useAffiliateChange Hook

El hook `useAffiliateChange` escucha este evento y ejecuta un callback cuando ocurre:

```javascript
// In any entity page
useAffiliateChange((affiliateId) => {
    console.log('Affiliate changed, reloading data...');
    load(); // Refresh the entity table
}, []);
```

### 3. Automatic Table Refresh

Todas las páginas de entidades que usan `EntityTable` implementan este hook para refrescar automáticamente sus datos:

- **Stories** - `src/pages/Admin/Stories/index.jsx`
- **Pages** - `src/pages/Admin/Pages/index.jsx`
- **Modules** - `src/pages/Admin/Modules/index.jsx`
- **Menus** - `src/pages/Admin/Menus/index.jsx`
- **Categories** - `src/pages/Admin/Categories/index.jsx`
- **Roles** - `src/pages/Admin/Roles/index.jsx`
- **Permissions** - `src/pages/Admin/Permissions/index.jsx`
- **Users** - `src/pages/Admin/Users/index.jsx`
- **Affiliates** - `src/pages/Admin/Affiliates/index.jsx`

## Implementation Details

### Hook Implementation

```javascript
// src/hooks/useAffiliateChange.js
export const useAffiliateChange = (callback, deps = []) => {
    const callbackRef = useRef(callback);
    
    // Update the ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleAffiliateChange = (event) => {
            callbackRef.current(event.detail.affiliateId);
        };

        window.addEventListener('affiliateChanged', handleAffiliateChange);

        return () => {
            window.removeEventListener('affiliateChanged', handleAffiliateChange);
        };
    }, deps);
};
```

### Page Implementation

```javascript
// Standard implementation in entity pages
import { useAffiliateChange } from '../../../hooks/useAffiliateChange';

const EntityPage = () => {
    // ... existing state and functions ...

    // Listen for affiliate changes and reload data
    useAffiliateChange((affiliateId) => {
        console.log('Affiliate changed, reloading data...');
        load();
    }, []);

    // ... rest of component ...
};
```

## Benefits

1. **Automatic Data Consistency**: Las tablas siempre muestran datos del affiliate correcto
2. **No Manual Refresh**: Los usuarios no necesitan recargar la página manualmente
3. **Seamless UX**: La transición entre affiliates es fluida y transparente
4. **Centralized Logic**: Toda la lógica de refresco está centralizada en un hook reutilizable

## Technical Notes

- El evento `affiliateChanged` se dispara desde el contexto de React
- El hook usa `useRef` para evitar problemas de stale closures
- Cada página implementa el hook de manera independiente
- El refresco se ejecuta inmediatamente después del cambio de affiliate
- No hay dependencias externas, solo eventos del navegador

## Future Enhancements

- **Debounced Refresh**: Implementar un delay para evitar múltiples refrescos rápidos
- **Selective Refresh**: Permitir que solo ciertas entidades se refresquen
- **Loading States**: Mostrar indicadores de carga durante el refresco
- **Error Handling**: Manejar errores durante el refresco automático
