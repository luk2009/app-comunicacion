import React, { useState, useEffect } from 'react';
// --- AÑADIDO: Importaciones para Drag and Drop ---
import { Droppable, Draggable } from '@hello-pangea/dnd';

// --- MODIFICADO: Recibimos la nueva prop 'onRemove' ---
function SentenceStrip({ selectedImages, onClear, onImageClick, onRemove }) {
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
      
      {/* --- MODIFICADO: Toda la lista ahora es un área Droppable --- */}
      <Droppable droppableId="sentence-strip" direction="horizontal">
        {(provided) => (
          <div 
            className="selected-images"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {selectedImages.map((image, index) => (
              // --- MODIFICADO: Cada imagen ahora es Draggable ---
              <Draggable key={image.instanceId} draggableId={image.instanceId} index={index}>
                {(provided, snapshot) => (
                  <div 
                    className={`image-card-small ${snapshot.isDragging ? 'dragging' : ''}`}
                    onClick={() => onImageClick(image)}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {/* --- AÑADIDO: Botón para eliminar el pictograma --- */}
                    <button 
                      className="remove-from-sentence-button" 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se active el clic de la imagen (maximizar/reproducir)
                        onRemove(image.instanceId);
                      }}
                    >
                      ×
                    </button>
                    {image.imageData ? (
                      <img src={image.imageData} alt={image.name} className="image-placeholder-small" />
                    ) : (
                      <p>{image.name}</p>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {selectedImages.length > 0 && (
        <button onClick={onClear} className="clear-button">×</button>
      )}
    </div>
  );
}

export default SentenceStrip;