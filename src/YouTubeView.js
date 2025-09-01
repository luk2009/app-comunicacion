// src/YouTubeView.js

import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from './AudioManager';

function YouTubeView({ images, onImageClick, activeImageId }) {
  const [mainImage, setMainImage] = useState(null);
  const thumbnailListRef = useRef(null);

  useEffect(() => {
    if (images && images.length > 0) {
      if (!mainImage || !images.some(img => img.id === mainImage.id)) {
        setMainImage(images[0]);
      }
    }
  }, [images, mainImage]);

  const handleThumbnailClick = (image) => {
    if (image.audioData) {
      // --- RED DE SEGURIDAD AÑADIDA ---
      audioManager.playSingle(image.audioData)
        .catch(err => {
          console.error("Fallo al reproducir audio de la miniatura:", err);
        });
    }
    setMainImage(image);
  };

  useEffect(() => {
    if (mainImage && thumbnailListRef.current) {
      const activeThumbnail = thumbnailListRef.current.querySelector(`[data-id="${mainImage.id}"]`);
      if (activeThumbnail) {
        activeThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [mainImage]);

  if (!images || images.length === 0) {
    return <div className="youtube-view-container">No hay imágenes para mostrar.</div>;
  }

  if (!mainImage) {
    return <div className="youtube-view-container">Cargando...</div>;
  }

  return (
    <div className="youtube-view-container">
      <div className="main-image-area">
        <div 
          className={`image-card main-image-card ${mainImage.id === activeImageId ? 'speaking' : ''}`}
          onClick={() => onImageClick(mainImage)}
        >
          {mainImage.imageData ? (
            <img src={mainImage.imageData} alt={mainImage.name} className="image-placeholder" />
          ) : (
            <div className="image-placeholder"></div>
          )}
          <p>{mainImage.name}</p>
        </div>
      </div>
      <div className="thumbnail-list" ref={thumbnailListRef}>
        {images.map(image => (
          <div
            key={image.id}
            data-id={image.id}
            className={`thumbnail-item ${mainImage.id === image.id ? 'active' : ''}`}
            onClick={() => handleThumbnailClick(image)}
          >
            <img src={image.imageData} alt={image.name} className="thumbnail-image" />
            <span className="thumbnail-title">{image.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YouTubeView;