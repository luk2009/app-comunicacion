import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd'; // <-- CAMBIO AQUÍ

function ImageGrid({ images, onImageClick, adminMode, onImageDelete, onImageEdit }) {
  if (!images) {
    return <div className="image-grid">Cargando imágenes...</div>;
  }

  const handleCardClick = (image) => {
    if (!adminMode) {
      onImageClick(image);
    }
  };

  return (
    <Droppable droppableId="image-grid">
      {(provided) => (
        <div 
          className="image-grid"
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {images.map((image, index) => (
            <Draggable key={image.id} draggableId={String(image.id)} index={index} isDragDisabled={!adminMode}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`image-card ${snapshot.isDragging ? 'dragging' : ''}`}
                  onClick={() => handleCardClick(image)}
                  style={{
                    ...provided.draggableProps.style,
                  }}
                >
                  {image.imageData ? (
                    <img src={image.imageData} alt={image.name} className="image-placeholder" />
                  ) : (
                    <div className="image-placeholder"></div>
                  )}
                  <p>{image.name}</p>
                  
                  {adminMode && (
                    <div className="admin-image-buttons">
                      {/* --- LÍNEA CORREGIDA --- */}
                      {/* Se pasa el objeto 'image' completo en lugar de solo 'image.id' */}
                      <button onClick={() => onImageDelete(image)} className="image-delete-button">×</button>
                      <button onClick={() => onImageEdit(image)} className="image-edit-button">✏️</button>
                    </div>
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default ImageGrid;