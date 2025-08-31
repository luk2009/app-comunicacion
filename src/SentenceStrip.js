import React, { useState, useEffect, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const DragHandleIcon = () => (
  <svg className="sentence-drag-handle-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

function SentenceStrip({ selectedImages, onClear, onImageClick, onRemove, activeImageId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioQueue = useRef([]);
  const currentAudio = useRef(null);

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
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <div 
                      className="card-clickable-area" 
                      onClick={() => onImageClick(image)}
                    >
                      {image.imageData ? (
                        <img src={image.imageData} alt={image.name} className="image-placeholder-small" />
                      ) : (
                        <p>{image.name}</p>
                      )}
                    </div>
                    
                    <div className="sentence-drag-handle" {...provided.dragHandleProps}>
                      <DragHandleIcon />
                    </div>

                    <button 
                      className="remove-from-sentence-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(image.instanceId);
                      }}
                    >
                      ×
                    </button>
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