import React, { useState, useEffect } from 'react';

function SentenceStrip({ selectedImages, onClear }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);

  // Este efecto se activa cuando la cola de audio cambia
  useEffect(() => {
    if (isSpeaking && audioQueue.length > 0) {
      const audioBlob = audioQueue[0];
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        // Cuando termina una, quita el audio de la cola y reproduce el siguiente
        setAudioQueue(currentQueue => currentQueue.slice(1));
      };
    } else if (isSpeaking && audioQueue.length === 0) {
      // Si la cola está vacía, terminamos de hablar
      setIsSpeaking(false);
    }
  }, [isSpeaking, audioQueue]);

  const handleSpeak = () => {
    if (isSpeaking || selectedImages.length === 0) return;

    // Filtramos para obtener solo las imágenes que tienen audio guardado
    const imagesWithAudio = selectedImages.filter(img => img.audioData);

    if (imagesWithAudio.length === 0) {
      console.warn("Ninguna de las imágenes seleccionadas tiene audio para reproducir.");
      return;
    }

    // Llenamos la cola de reproducción y activamos el estado de 'hablando'
    setAudioQueue(imagesWithAudio.map(img => img.audioData));
    setIsSpeaking(true);
  };

  return (
    <div className="sentence-strip">
      <button 
        onClick={handleSpeak} 
        className="speak-button" 
        disabled={isSpeaking || selectedImages.length === 0}
        aria-label="Reproducir frase"
      >
        {isSpeaking ? <div className="spinner"></div> : '▶️'}
      </button>
      <div className="selected-images">
        {selectedImages.map((image, index) => (
          <div key={`${image.id}-${index}`} className="image-card-small">
            {image.imageData ? (
              <img src={image.imageData} alt={image.name} className="image-placeholder-small" />
            ) : (
              <div className="image-placeholder-small"></div>
            )}
            <p>{image.name}</p>
          </div>
        ))}
      </div>
      {selectedImages.length > 0 && (
        <button onClick={onClear} className="clear-button" aria-label="Limpiar frase">×</button>
      )}
    </div>
  );
}

export default SentenceStrip;

