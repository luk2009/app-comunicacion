// src/SentenceStrip.js
import React from 'react';

function SentenceStrip({ selectedImages, onClear }) {
  // En una app completa, un botón de "Play" aquí usaría la API de voz del navegador
  // para leer en voz alta el texto de las imágenes seleccionadas.
  return (
    <div className="sentence-strip">
      <div className="selected-images">
        {selectedImages.map((image, index) => (
          <div key={index} className="image-card-small">
            {image}
          </div>
        ))}
      </div>
      <button onClick={onClear} className="clear-button">X</button>
    </div>
  );
}

export default SentenceStrip;