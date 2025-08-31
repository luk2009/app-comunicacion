import React, { useState, useEffect, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

function SentenceStrip({ selectedImages, onClear, onImageClick, onRemove, activeImageId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioQueue = useRef([]);
  const currentAudio = useRef(null);

  useEffect(() => {
    // Este efecto limpia el audio si el componente se cierra mientras algo se reproduce.
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
      
      <Droppable droppableId="sentence-strip" direction="horizontal">
        {(provided) => (
          <div 
            className="selected-images"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {selectedImages.map((image, index) => (
              <Draggable key={image.instanceId} draggableId={image.instanceId} index={index}>
                {(provided, snapshot) => (
                  <div 
                    className={`image-card-small ${snapshot.isDragging ? 'dragging' : ''} ${image.id === activeImageId ? 'speaking' : ''}`}
                    onClick={() => onImageClick(image)}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <button 
                      className="remove-from-sentence-button" 
                      onClick={(e) => {
                        e.stopPropagation();
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