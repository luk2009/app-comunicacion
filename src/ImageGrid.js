// src/ImageGrid.js
import React from 'react';

function ImageGrid({ images, onImageClick }) {
  // En la app real, en lugar de texto, aquí se mostrarían las fotos
  // que cargues desde la galería de la tablet.
  return (
    <div className="image-grid">
      {images.map(image => (
        <div key={image} className="image-card" onClick={() => onImageClick(image)}>
          <div className="image-placeholder">{/* Aquí iría la foto */}</div>
          <p>{image}</p>
        </div>
      ))}
    </div>
  );
}

export default ImageGrid;