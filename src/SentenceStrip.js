import React, { useState, useEffect } from 'react';

// --- PASO 2: Recibimos la nueva prop 'onImageClick' ---
function SentenceStrip({ selectedImages, onClear, onImageClick }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioQueue = React.useRef([]);
  const currentAudio = React.useRef(null);

  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
    };
  }, []);

  const playNextAudio = () => {
    if (audioQueue.current.length === 0) {
      setIsPlaying(false);
      return;
    }
    
    setError(false);
    const audioUrl = audioQueue.current.shift();
    currentAudio.current = new Audio(audioUrl);
    
    currentAudio.current.play().catch(e => {
      console.error("Error al reproducir audio:", e);
      setError(true);
      playNextAudio();
    });

    currentAudio.current.onended = () => {
      playNextAudio();
    };
  };

  const handleSpeak = () => {
    if (isPlaying) return;
    const audioUrls = selectedImages
      .map(img => img.audioData)
      .filter(audioData => typeof audioData === 'string' && audioData.startsWith('https'));

    if (audioUrls.length === 0) {
      console.warn("Ninguna de las imágenes seleccionadas tiene audio para reproducir.");
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    audioQueue.current = [...audioUrls];
    setIsPlaying(true);
    playNextAudio();
  };
  
  return (
    <div className="sentence-strip">
      <button 
        onClick={handleSpeak} 
        disabled={isPlaying || selectedImages.length === 0}
        className={`speak-button ${error ? 'error' : ''}`}
      >
        {isPlaying ? <div className="spinner"></div> : '▶️'}
      </button>
      <div className="selected-images">
        {selectedImages.map(image => (
          // --- PASO 2: Añadimos el evento onClick a cada imagen de la frase ---
          <div 
            key={image.instanceId} 
            className="image-card-small"
            onClick={() => onImageClick(image)} // <-- ¡AQUÍ ESTÁ LA MAGIA!
          >
            {image.imageData ? (
              <img src={image.imageData} alt={image.name} className="image-placeholder-small" />
            ) : (
              <p>{image.name}</p>
            )}
          </div>
        ))}
      </div>
      {selectedImages.length > 0 && (
        <button onClick={onClear} className="clear-button">×</button>
      )}
    </div>
  );
}

export default SentenceStrip;