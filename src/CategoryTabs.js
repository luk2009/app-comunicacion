// src/CategoryTabs.js
import React from 'react';

function CategoryTabs({ categories, activeCategory, onCategorySelect }) {
  return (
    <div className="category-tabs">
      {categories.map(category => (
        <button 
          key={category.id} // Corregido: Usamos el 'id' único como clave.
          className={category.id === activeCategory?.id ? 'tab-button active' : 'tab-button'}
          onClick={() => onCategorySelect(category)}
        >
          {category.name} {/* Corregido: Mostramos solo el 'name' de la categoría. */}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;