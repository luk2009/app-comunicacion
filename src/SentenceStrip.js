import React, { useState, useEffect } from 'react';

function SentenceStrip({ selectedImages, onClear }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioQueue = React.useRef([]);
  const currentAudio = React.useRef(null);

  useEffect(() => {
    // Limpia el audio si la frase se limpia mientras se reproduce
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
    const audioUrl = audioQueue.current.shift(); // Saca la siguiente URL de la cola
    currentAudio.current = new Audio(audioUrl);
    
    currentAudio.current.play().catch(e => {
      console.error("Error al reproducir audio:", e);
      setError(true);
      playNextAudio(); // Intenta reproducir el siguiente
    });

    currentAudio.current.onended = () => {
      playNextAudio();
    };
  };

  const handleSpeak = () => {
    if (isPlaying) return;

    // Filtramos las imágenes para obtener solo las que tienen una URL de audio válida
    const audioUrls = selectedImages
      .map(img => img.audioData)
      .filter(audioData => typeof audioData === 'string' && audioData.startsWith('https'));

    if (audioUrls.length === 0) {
      console.warn("Ninguna de las imágenes seleccionadas tiene audio para reproducir.");
      setError(true);
      setTimeout(() => setError(false), 2000); // Muestra el error por 2 segundos
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
          <div key={`${image.id}-${Date.now()}`} className="image-card-small">
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
