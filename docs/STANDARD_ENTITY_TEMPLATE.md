# 📋 Standard Entity Template

> **Version**: 1.0  
> **Last Updated**: December 2024  
> **Implements**: Entity Integration Rules v1.2

This document defines the **standardized function names and structure** that ALL entity pages must follow.

## 🎯 Purpose

Ensure consistency across all entity components by using the **same function names** and **structure** regardless of the entity type.

## 📁 Required Structure

```
src/pages/Admin/[Entity]/
└── index.jsx                 # Main entity page component
```

## 🔧 Standard Function Names

Every entity page **MUST** implement these 4 core functions with **exactly these names**:

### 1. `load()` - Load Entities List
```javascript
/**
 * Load entities with pagination and filtering
 */
const load = async (page = 1, limit = 20, search = '', filters = {}) => {
    setLoading(true);
    try {
        const params = { page, limit, search, ...filters };
        const response = await entityService.get(params);
        
        if (response.success) {
            setEntities(response.data || []);
            setPagination(response.pagination || null);
            setCurrentPage(page);
            setPageSize(limit);
            setCurrentSearch(search);
            setCurrentFilters(filters);
        }
    } catch (error) {
        console.error('Error loading entities:', error);
        setEntities([]);
        setPagination(null);
    } finally {
        setLoading(false);
    }
};
```

### 2. `loadForEditing()` - Load Single Entity
```javascript
/**
 * Load single entity for editing
 */
const loadForEditing = async (id) => {
    try {
        const response = await entityService.getById(id);
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.error || 'Failed to load entity');
        }
    } catch (error) {
        console.error('Error loading entity for editing:', error);
        throw error;
    }
};
```

### 3. `save()` - Save Entity
```javascript
/**
 * Save entity (create or update)
 */
const save = async (data, id = null) => {
    try {
        let response;
        if (id) {
            response = await entityService.update(id, data);
        } else {
            response = await entityService.create(data);
        }

        if (response.success) {
            await load(); // Refresh table
            return response.data;
        } else {
            throw new Error(response.error || 'Failed to save entity');
        }
    } catch (error) {
        console.error('Error saving entity:', error);
        throw error;
    }
};
```

### 4. `deleteEntity()` - Delete Entity
```javascript
/**
 * Delete entity
 */
const deleteEntity = async (id) => {
    try {
        const response = await entityService.delete(id);
        if (response.success) {
            await load(); // Refresh table
            return true;
        } else {
            throw new Error(response.error || 'Failed to delete entity');
        }
    } catch (error) {
        console.error('Error deleting entity:', error);
        throw error;
    }
};
```

## 📊 Standard State Variables

Every entity page **MUST** use these exact state variable names:

```javascript
// Entity data
const [entities, setEntities] = useState([]);           // Always plural
const [loading, setLoading] = useState(false);
const [pagination, setPagination] = useState(null);

// Pagination and filters
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [currentSearch, setCurrentSearch] = useState('');
const [currentFilters, setCurrentFilters] = useState({});

// Table reference
const tableRef = useRef(null);
```

## 🔗 Standard TableConfig Integration

The functions must be connected to EntityTable using these **exact property names**:

```javascript
const tableConfig = {
    // ... other config
    
    // Event handlers (SAME FOR ALL ENTITIES)
    onSearch: (searchTerm, filters) => load(1, pageSize, searchTerm, filters),
    onPageChange: (page) => load(page, pageSize, currentSearch, currentFilters),
    onPageSizeChange: (newPageSize) => load(1, newPageSize, currentSearch, currentFilters),

    // Editor integration (SAME FOR ALL ENTITIES)
    onLoadEntity: loadForEditing,
    onSaveEntity: save,
    
    // Actions (SAME FOR ALL ENTITIES)
    actionHandlers: {
        delete: deleteEntity
    }
};
```

## 📝 Code Comments Standard

Use these **exact comment blocks** for consistency:

```javascript
// ============================================================================
// STANDARD API METHODS (Same names across all entities)
// ============================================================================

/**
 * Load entities with pagination and filtering
 */
const load = async (...) => { /* ... */ };

/**
 * Load single entity for editing
 */
const loadForEditing = async (...) => { /* ... */ };

/**
 * Save entity (create or update)
 */
const save = async (...) => { /* ... */ };

/**
 * Delete entity
 */
const deleteEntity = async (...) => { /* ... */ };
```

## ✅ Compliance Checklist

When creating a new entity or updating an existing one:

### Function Names
- [ ] ✅ `load()` (not `loadEntities()`, `loadPages()`, etc.)
- [ ] ✅ `loadForEditing()` (not `loadEntityForEditing()`, `loadPageForEditing()`, etc.)
- [ ] ✅ `save()` (not `saveEntity()`, `savePage()`, etc.)
- [ ] ✅ `deleteEntity()` (not `delete()`, `deletePage()`, etc.)

### State Variables
- [ ] ✅ `entities` (plural, not `pages`, `categories`, etc.)
- [ ] ✅ `loading`, `pagination`, `currentPage`, `pageSize`
- [ ] ✅ `currentSearch`, `currentFilters`, `tableRef`

### TableConfig Integration
- [ ] ✅ `onLoadEntity: loadForEditing`
- [ ] ✅ `onSaveEntity: save`
- [ ] ✅ `delete: deleteEntity`
- [ ] ✅ Standard event handlers using `load()`

### Comments and Documentation
- [ ] ✅ Standard comment blocks for API methods
- [ ] ✅ JSDoc comments for each function
- [ ] ✅ Consistent code organization

## 🚫 Common Mistakes to Avoid

### ❌ Wrong Function Names
```javascript
// DON'T DO THIS
const loadPages = async () => { /* ... */ };
const saveCategory = async () => { /* ... */ };
const deleteUser = async () => { /* ... */ };

// DO THIS INSTEAD
const load = async () => { /* ... */ };
const save = async () => { /* ... */ };
const deleteEntity = async () => { /* ... */ };
```

### ❌ Inconsistent State Names
```javascript
// DON'T DO THIS
const [pages, setPages] = useState([]);
const [categories, setCategories] = useState([]);

// DO THIS INSTEAD
const [entities, setEntities] = useState([]);
```

### ❌ Wrong TableConfig References
```javascript
// DON'T DO THIS
onLoadEntity: loadPageForEditing,
onSaveEntity: savePage,
delete: deletePage

// DO THIS INSTEAD
onLoadEntity: loadForEditing,
onSaveEntity: save,
delete: deleteEntity
```

## 📚 Reference Implementations

See these files as **perfect examples** of the standard:

- ✅ `src/pages/Admin/Pages/index.jsx` - DynamicPage example
- ✅ `src/pages/Admin/Categories/index.jsx` - DynamicModal example

## 🔄 Migration Guide

To update an existing entity to follow the standard:

1. **Rename functions**:
   - `loadEntities()` → `load()`
   - `loadEntityForEditing()` → `loadForEditing()`
   - `saveEntity()` → `save()`
   - `deleteEntity()` → keep as is (already correct)

2. **Update all function calls** throughout the file

3. **Update tableConfig references**

4. **Standardize state variable names**

5. **Add standard comment blocks**

6. **Test compilation** with `npm run build`

---

**💡 Remember: The goal is that ANY developer can jump between entity files and immediately understand the structure because EVERY entity follows the EXACT same pattern.** 