import React, { useState } from 'react';
import './Sidebar.css';

const defaultCategories = [
    {
        title: 'Foundation',
        items: [
            { name: 'Concrete Slab', icon: '🟫' },
            { name: 'Pillars', icon: '🧱' },
            { name: 'Beams', icon: '🔩' },
            { name: 'Footings', icon: '🏗️' },
            { name: 'Basement', icon: '🏚️' }
        ]
    },
    {
        title: 'Walls',
        items: [
            { name: 'Brick Wall', icon: '🧱' },
            { name: 'Wooden Wall', icon: '🟫' },
            { name: 'Glass Wall', icon: '🏢' },
            { name: 'Partition Wall', icon: '🧱' }
        ]
    },
    {
        title: 'Doors & Windows',
        items: [
            { name: 'Single Door', icon: '🚪' },
            { name: 'Double Door', icon: '🚪' },
            { name: 'Sliding Door', icon: '🚪' },
            { name: 'Bay Window', icon: '🪟' },
            { name: 'Casement Window', icon: '🪟' }
        ]
    },
    {
        title: 'Roofing',
        items: [
            { name: 'Flat Roof', icon: '🏠' },
            { name: 'Sloped Roof', icon: '🏡' },
            { name: 'Concrete Roof', icon: '🏠' }
        ]
    },
    {
        title: 'Plumbing',
        items: [
            { name: 'Pipes', icon: '🛠️' },
            { name: 'Wash Basin', icon: '🚰' },
            { name: 'Water Tank', icon: '🚿' },
            { name: 'Toilet', icon: '🚽' }
        ]
    },
    {
        title: 'Electrical',
        items: [
            { name: 'Switchboard', icon: '🔌' },
            { name: 'Ceiling Light', icon: '💡' },
            { name: 'Wall Fan', icon: '🌀' },
            { name: 'Wiring', icon: '🔧' }
        ]
    },
    {
        title: 'Interior',
        items: [
            { name: 'Modular Kitchen', icon: '🍳' },
            { name: 'Cupboards', icon: '🛋️' },
            { name: 'False Ceiling', icon: '🏢' },
            { name: 'TV Unit', icon: '📺' }
        ]
    },
    {
        title: 'Furniture',
        items: [
            { name: 'Bed', icon: '🛏️' },
            { name: 'Sofa', icon: '🛋️' },
            { name: 'Dining Table', icon: '🍽️' },
            { name: 'Chairs', icon: '🪑' }
        ]
    },
    {
        title: 'Exterior & Landscaping',
        items: [
            { name: 'Garden', icon: '🌳' },
            { name: 'Fence', icon: '🛡️' },
            { name: 'Driveway', icon: '🚗' },
            { name: 'Lawn', icon: '🌿' }
        ]
    },
    {
        title: 'Decoration',
        items: [
            { name: 'Torans', icon: '🎉' },
            { name: 'Rangoli', icon: '🎨' },
            { name: 'Flower Pots', icon: '🌼' },
            { name: 'Name Plate', icon: '📛' }
        ]
    }
];

function Sidebar({ categories = defaultCategories }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openCategories, setOpenCategories] = useState(() => {
        const initialState = {};
        categories.forEach(cat => {
            initialState[cat.title] = false;
        });
        return initialState;
    });

    const toggleCategory = (title) => {
        setOpenCategories(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const renderItemIcon = (icon) => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            const isImage = icon.startsWith('http') || icon.endsWith('.png') || icon.endsWith('.svg');
            if (isImage) {
                return <img src={icon} alt="" />;
            } else {
                return icon;
            }
        }
        return icon;
    };

    const filteredCategories = categories
        .filter(cat => {
            if (!searchTerm) return true;
            return cat.items.some(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        })
        .map(cat => {
            if (!searchTerm) {
                return cat;
            }
            const matchedItems = cat.items.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return { ...cat, items: matchedItems };
        });

    return (
        <div className="sidebar">
            <div className="sidebar-search">
                <input type="text" className="sidebar-search-input" placeholder="Search components..." value={searchTerm} onChange={handleSearchChange} />
            </div>
            {filteredCategories.map(category => {
                const isOpen = openCategories[category.title] || !!searchTerm;
                return (
                    <div key={category.title}
                        className={`sidebar-category ${isOpen ? 'open' : ''}`} >
                        <div
                            className="sidebar-category-title"
                            onClick={() => {
                                if (!searchTerm) toggleCategory(category.title);
                            }}
                        >
                            <span>{category.title}</span>
                            <span className="sidebar-toggle-icon">
                                {isOpen ? '▼' : '▶'}
                            </span>
                        </div>
                        <ul className="sidebar-items">
                            {category.items.map(item => (
                                <li key={item.name} className="sidebar-item">
                                    {item.icon && (
                                        <span className="sidebar-item-icon">
                                            {renderItemIcon(item.icon)}
                                        </span>
                                    )}
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

export default Sidebar;
