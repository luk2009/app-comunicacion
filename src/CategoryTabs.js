// src/CategoryTabs.js
import React from 'react';

function CategoryTabs({ categories, activeCategory, onCategorySelect }) {
  return (
    <div className="category-tabs">
      {categories.map(category => (
        <button 
          key={category}
          className={category === activeCategory ? 'tab-button active' : 'tab-button'}
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;