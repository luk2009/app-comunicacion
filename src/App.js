// src/App.js
import React, { useState } from 'react';
import './App.css';
import CategoryTabs from './CategoryTabs';
import ImageGrid from './ImageGrid';
import SentenceStrip from './SentenceStrip';

// Datos de ejemplo. Más adelante, esto vendrá de la galería o de tu configuración.
const initialData = {
  Comida: ['Manzana', 'Jugo', 'Galleta', 'Agua', 'Leche', 'Pan'],
  Actividades: ['Jugar', 'Parque', 'Pintar', 'Música', 'Leer', 'TV'],
  Personal: ['Baño', 'Dientes', 'Dormir', 'Ropa', 'Manos', 'Ayuda'],
  Sentimientos: ['Feliz', 'Triste', 'Cansado', 'Enojado'],
};

function App() {
  const [activeCategory, setActiveCategory] = useState('Comida');
  const [sentence, setSentence] = useState([]);
  const [images] = useState(initialData);

  const handleImageClick = (image) => {
    // Evita añadir la misma imagen consecutivamente si ya es la última
    if (sentence[sentence.length - 1] === image) return;
    setSentence([...sentence, image]);
  };

  const clearSentence = () => {
    setSentence([]);
  };

  return (
    <div className="app-container">
      <SentenceStrip selectedImages={sentence} onClear={clearSentence} />
      <div className="main-content">
        <CategoryTabs 
          categories={Object.keys(images)} 
          activeCategory={activeCategory}
          onCategorySelect={setActiveCategory} 
        />
        <ImageGrid 
          images={images[activeCategory]}
          onImageClick={handleImageClick}
        />
      </div>
    </div>
  );
}

export default App;