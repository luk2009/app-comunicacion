import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { audioManager } from './AudioManager';

// --- CÓDIGO DEL ÍCONO RESTAURADO ---
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
  const [playingIndex, setPlayingIndex] = useState(-1);

  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, []);

  useEffect(() => {
    selectedImages.forEach(image => {
      if (image.audioData) {
        audioManager.preloadAudio(image.audioData);
      }
    });
  }, [selectedImages]);

  const handleSpeak = async () => {
    if (isPlaying) {
      audioManager.stopAll();
      setIsPlaying(false);
      setPlayingIndex(-1);
      return;
    }

    const audioUrls = selectedImages
      .map(img => img.audioData)
      .filter(audioData => typeof audioData === 'string' && (audioData.startsWith('https') || audioData.startsWith('data:audio')));

    if (audioUrls.length === 0) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    setIsPlaying(true);
    setError(false);
    
    try {
      await audioManager.playSequence(
        audioUrls,
        (currentIndex) => {
          setPlayingIndex(currentIndex);
        }
      );
    } catch (e) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setIsPlaying(false);
      setPlayingIndex(-1);
    }
  };

  const handleImageClick = (image) => {
    if (isPlaying) return;
    onImageClick(image);
  };
  
  return (
    <div className="sentence-strip">
      <button 
        onClick={handleSpeak} 
        disabled={selectedImages.length === 0}
        className={`speak-button ${error ? 'error' : ''} ${isPlaying ? 'playing' : ''}`}
      >
        {isPlaying ? <div className="spinner"></div> : '▶️'}
      </button>
      
      <Droppable droppableId="sentence-strip" direction="horizontal">
        {(provided) => (
          <div className="selected-images" ref={provided.innerRef} {...provided.droppableProps}>
            {selectedImages.map((image, index) => (
              <Draggable key={image.instanceId} draggableId={image.instanceId} index={index}>
                {(provided, snapshot) => {
                  const isCurrentlyPlayingInSequence = isPlaying && playingIndex === index;
                  return (
                    <div 
                      className={`image-card-small 
                        ${snapshot.isDragging ? 'dragging' : ''} 
                        ${image.id === activeImageId ? 'speaking' : ''}
                        ${isCurrentlyPlayingInSequence ? 'sequence-playing' : ''}
                      `}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div className="card-clickable-area" onClick={() => handleImageClick(image)}>
                        {image.imageData ? (
                          <img src={image.imageData} alt={image.name} className="image-placeholder-small" />
                        ) : (<p>{image.name}</p>)}
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
                        disabled={isPlaying}
                      >
                        ×
                      </button>
                    </div>
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {selectedImages.length > 0 && (
        <button onClick={onClear} className="clear-button" disabled={isPlaying}>×</button>
      )}
    </div>
  );
}

export default SentenceStrip;