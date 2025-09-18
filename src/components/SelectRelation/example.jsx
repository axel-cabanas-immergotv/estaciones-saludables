import React, { useState } from 'react';
import SelectRelation from './index';

/**
 * Example Component - Demonstrates SelectRelation component usage
 * This file shows how to implement SelectRelation in different scenarios
 */

// Example 1: Basic Single Selection with AJAX
function BasicSingleSelection() {
    const [selectedUser, setSelectedUser] = useState([]);

    return (
        <div className="example-section">
            <h3>Basic Single Selection with AJAX</h3>
            <p>Select a single user as story owner using AJAX configuration</p>
            
            <SelectRelation
                entity="users"
                ajax={{
                    url: '/api/users',
                    dataType: 'json',
                    delay: 250,
                    data: params => ({ q: params.term }),
                    processResults: data => ({ results: data.items })
                }}
                key="id"
                label="name"
                multiple={false}
                selectedItems={selectedUser}
                onChange={setSelectedUser}
                fieldLabel="Story Owner"
                placeholder="Select a user..."
                required={true}
                allowClear={true}
                minimumInputLength={2}
                debug={true}
            />
            
            <div className="selected-info">
                <strong>Selected:</strong> {selectedUser.length > 0 ? selectedUser[0].name : 'None'}
            </div>
        </div>
    );
}

// Example 2: Multiple Selection with Local Data
function MultipleSelection() {
    const [selectedCategories, setSelectedCategories] = useState([]);

    const localCategories = [
        { id: 1, name: 'Technology', type: 'story' },
        { id: 2, name: 'Business', type: 'story' },
        { id: 3, name: 'Science', type: 'story' },
        { id: 4, name: 'Health', type: 'story' },
        { id: 5, name: 'Entertainment', type: 'story' }
    ];

    return (
        <div className="example-section">
            <h3>Multiple Selection with Local Data</h3>
            <p>Select multiple categories from local data array</p>
            
            <SelectRelation
                entity="categories"
                data={localCategories}
                key="id"
                label="name"
                multiple={true}
                selectedItems={selectedCategories}
                onChange={setSelectedCategories}
                fieldLabel="Story Categories"
                placeholder="Select categories..."
                required={false}
                maximumSelectionLength={3}
                allowClear={true}
                closeOnSelect={false}
                theme="modern"
            />
            
            <div className="selected-info">
                <strong>Selected:</strong> {selectedCategories.length} categories
                {selectedCategories.length > 0 && (
                    <ul>
                        {selectedCategories.map(cat => (
                            <li key={cat.id}>{cat.name}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// Example 3: Advanced AJAX with Custom Templates
function AdvancedAJAX() {
    const [selectedStories, setSelectedStories] = useState([]);

    return (
        <div className="example-section">
            <h3>Advanced AJAX with Custom Templates</h3>
            <p>Advanced configuration with custom result and selection templates</p>
            
            <SelectRelation
                entity="stories"
                ajax={{
                    url: '/api/stories',
                    dataType: 'json',
                    delay: 300,
                    data: params => ({ 
                        search: params.term,
                        published: true
                    }),
                    processResults: data => ({ results: data.stories || data })
                }}
                key="id"
                label="title"
                multiple={true}
                selectedItems={selectedStories}
                onChange={setSelectedStories}
                fieldLabel="Related Stories"
                placeholder="Search and select stories..."
                required={false}
                minimumInputLength={3}
                maximumInputLength={50}
                templateResult={(story) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{story.title}</span>
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            by {story.author}
                        </span>
                    </div>
                )}
                templateSelection={(story) => story.title.substring(0, 30) + '...'}
                allowClear={true}
                closeOnSelect={false}
                theme="classic"
                width="100%"
            />
            
            <div className="selected-info">
                <strong>Selected:</strong> {selectedStories.length} stories
            </div>
        </div>
    );
}

// Example 4: Tags Mode with Custom Matcher
function TagsMode() {
    const [selectedTags, setSelectedTags] = useState([]);

    const customMatcher = (params, data) => {
        const term = params.term.toLowerCase();
        const text = data.name.toLowerCase();
        
        if (text === term) return true;
        if (text.startsWith(term)) return true;
        return text.includes(term);
    };

    return (
        <div className="example-section">
            <h3>Tags Mode with Custom Matcher</h3>
            <p>Allow creating new tags with custom search logic</p>
            
            <SelectRelation
                entity="tags"
                ajax={{
                    url: '/api/tags',
                    dataType: 'json',
                    delay: 200,
                    data: params => ({ 
                        q: params.term,
                        active: true
                    }),
                    processResults: data => ({ results: data.tags || data })
                }}
                key="id"
                label="name"
                multiple={true}
                selectedItems={selectedTags}
                onChange={setSelectedTags}
                fieldLabel="Story Tags"
                placeholder="Type to search or create tags..."
                required={false}
                tags={true}
                matcher={customMatcher}
                minimumInputLength={1}
                allowClear={true}
                closeOnSelect={false}
                theme="minimal"
                className="tags-select"
            />
            
            <div className="selected-info">
                <strong>Selected:</strong> {selectedTags.length} tags
                {selectedTags.length > 0 && (
                    <ul>
                        {selectedTags.map(tag => (
                            <li key={tag.id}>
                                {tag.name}
                                {tag.isNew && <span style={{ color: '#8b5cf6' }}> (new)</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// Example 5: Form Integration
function FormIntegration() {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        author: [],
        categories: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="example-section">
            <h3>Form Integration</h3>
            <p>Complete form with multiple SelectRelation components</p>
            
            <form onSubmit={handleSubmit} className="story-form">
                <div className="form-group">
                    <label htmlFor="title">Story Title</label>
                    <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => updateField('content', e.target.value)}
                        rows="4"
                        required
                    />
                </div>

                <div className="form-group">
                    <SelectRelation
                        entity="users"
                        ajax={{
                            url: '/api/users',
                            dataType: 'json',
                            delay: 250,
                            data: params => ({ 
                                q: params.term,
                                role: 'author',
                                status: 'active'
                            }),
                            processResults: data => ({ results: data.users || data })
                        }}
                        key="id"
                        label="name"
                        multiple={false}
                        selectedItems={formData.author}
                        onChange={(value) => updateField('author', value)}
                        fieldLabel="Author"
                        placeholder="Search for author..."
                        required={true}
                        allowClear={true}
                        minimumInputLength={2}
                        closeOnSelect={true}
                        theme="classic"
                    />
                </div>

                <div className="form-group">
                    <SelectRelation
                        entity="categories"
                        ajax={{
                            url: '/api/categories',
                            dataType: 'json',
                            delay: 200,
                            data: params => ({ 
                                q: params.term,
                                type: 'story',
                                active: true
                            }),
                            processResults: data => ({ results: data.categories || data })
                        }}
                        key="id"
                        label="name"
                        multiple={true}
                        selectedItems={formData.categories}
                        onChange={(value) => updateField('categories', value)}
                        fieldLabel="Categories"
                        placeholder="Search and select categories..."
                        required={false}
                        maximumSelectionLength={5}
                        allowClear={true}
                        closeOnSelect={false}
                        theme="modern"
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Create Story
                </button>
            </form>
        </div>
    );
}

// Example 6: RTL Support and Internationalization
function RTLAndInternationalization() {
    const [selectedItems, setSelectedItems] = useState([]);

    const customLanguage = {
        noResults: () => "لا توجد نتائج",
        searching: () => "جاري البحث...",
        loading: () => "جاري التحميل...",
        error: () => "خطأ في تحميل البيانات",
        inputTooShort: () => "يرجى إدخال المزيد من الأحرف",
        inputTooLong: () => "يرجى إدخال عدد أقل من الأحرف",
        maximumSelected: () => "يمكنك اختيار 5 عناصر فقط"
    };

    return (
        <div className="example-section">
            <h3>RTL Support and Internationalization</h3>
            <p>Right-to-left text direction with Arabic language support</p>
            
            <SelectRelation
                entity="articles"
                ajax={{
                    url: '/api/articles',
                    dataType: 'json',
                    delay: 300,
                    data: params => ({ 
                        q: params.term,
                        language: 'ar',
                        published: true
                    }),
                    processResults: data => ({ results: data.articles || data })
                }}
                key="id"
                label="title"
                multiple={true}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
                fieldLabel="المقالات ذات الصلة"
                placeholder="اختر المقالات..."
                required={false}
                dir="rtl"
                language={customLanguage}
                allowClear={true}
                closeOnSelect={false}
                theme="classic"
                maximumSelectionLength={5}
            />
            
            <div className="selected-info">
                <strong>المحدد:</strong> {selectedItems.length} مقالة
            </div>
        </div>
    );
}

// Main Example Component
function SelectRelationExamples() {
    return (
        <div className="select-relation-examples">
            <h1>SelectRelation Component Examples</h1>
            <p>This page demonstrates various use cases and configurations of the SelectRelation component.</p>
            
            <BasicSingleSelection />
            <MultipleSelection />
            <AdvancedAJAX />
            <TagsMode />
            <FormIntegration />
            <RTLAndInternationalization />
            
            <div className="example-section">
                <h3>Usage Notes</h3>
                <ul>
                    <li>All examples use mock API endpoints - replace with your actual API URLs</li>
                    <li>The component supports both AJAX configuration and standard API URLs</li>
                    <li>Advanced features include real-time search, custom templates, and RTL support</li>
                    <li>Tags mode allows creating new options on the fly</li>
                    <li>Multiple themes and styling options are available</li>
                    <li>Full keyboard navigation and accessibility support</li>
                    <li>Internationalization with custom language support</li>
                    <li>Debug mode for development and troubleshooting</li>
                </ul>
            </div>
        </div>
    );
}

export default SelectRelationExamples;

// Export individual examples for testing
export {
    BasicSingleSelection,
    MultipleSelection,
    AdvancedAJAX,
    TagsMode,
    FormIntegration,
    RTLAndInternationalization
};
