// src/App.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import CategoryTabs from './CategoryTabs';
import ImageGrid from './ImageGrid';
import SentenceStrip from './SentenceStrip';
import AdminPanel from './AdminPanel';
import EditImageModal from './EditImageModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, populateInitialData } from './db';
import { DragDropContext } from '@hello-pangea/dnd';

function App() {
  useEffect(() => {
    populateInitialData();
  }, []);

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const images = useLiveQuery(() => db.images.toArray(), []);

  const [activeCategory, setActiveCategory] = useState(null);
  const [sentence, setSentence] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [maximizedImage, setMaximizedImage] = useState(null);
  const [imageToEdit, setImageToEdit] = useState(null);
  
  const [displayedImages, setDisplayedImages] = useState([]);

  // --- CAMBIO #1: Usar useMemo para ordenar categorías de forma segura y eficiente ---
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    // Creamos una copia con [...categories] antes de ordenar para no mutar el original
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  useEffect(() => {
    if (!images || !activeCategory) {
      setDisplayedImages([]);
      return;
    }
    const sorted = images
      .filter(img => img.categoryId === activeCategory.id)
      .sort((a, b) => a.order - b.order);
    
    setDisplayedImages(sorted);
  }, [images, activeCategory]);

  const longPressTimer = useRef();

  const handleButtonPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setAdminMode(true);
    }, 1500);
  };

  const handleButtonPressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  useEffect(() => {
    // Usamos la nueva variable 'sortedCategories' que ya está ordenada
    if (sortedCategories && sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0]);
    }
  }, [sortedCategories, activeCategory]);

  const handleImageClick = (image) => {
    if (adminMode || maximizedImage) return;
    
    const alreadyExists = sentence.some(item => item.id === image.id);
    if (alreadyExists) return;

    setMaximizedImage(image);
    setSentence([...sentence, image]);

    setTimeout(() => {
      setMaximizedImage(null);
    }, 1500);
  };

  const clearSentence = () => {
    setSentence([]);
  };

  const handleImageDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
        try {
            await db.images.delete(id);
          } catch (error) {
            console.error("Error al eliminar la imagen:", error);
            alert("No se pudo eliminar la imagen.");
          }
    }
  };

  const handleImageUpdate = async (updatedImage) => {
    try {
      await db.images.update(updatedImage.id, {
        name: updatedImage.name,
        categoryId: Number(updatedImage.categoryId),
        imageData: updatedImage.imageData,
      });
      setImageToEdit(null);
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al actualizar la imagen:", error);
      alert("No se pudo actualizar la imagen.");
    }
  };
  
  // --- CAMBIO #2: Corregida la lógica de reordenar imágenes ---
  const onDragEnd = (result) => {
    const { destination, source } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const currentImages = Array.from(displayedImages);
    const [movedImage] = currentImages.splice(source.index, 1);
    // La lógica correcta es usar splice de nuevo en el índice de destino
    currentImages.splice(destination.index, 0, movedImage);

    const updates = currentImages.map((img, index) => ({
      key: img.id,
      changes: { order: index + 1 }
    }));
    
    db.images.bulkUpdate(updates).catch(err => {
      console.error("Fallo al actualizar el orden:", err);
    });
  };

  // --- CAMBIO #3: Simplificada la función de reordenar categorías ---
// Reemplaza la función handleCategoryOrderChange en App.js con esta versión corregida:

const handleCategoryOrderChange = async (categoryId, direction) => {
  if (!sortedCategories || sortedCategories.length < 2) return;

  const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
  if (currentIndex === -1) return;

  let newIndex;
  if (direction === 'up' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < sortedCategories.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return; // No se puede mover más
  }

  // Crear una copia del array para reordenar
  const reorderedCategories = [...sortedCategories];
  
  // Intercambiar las posiciones
  [reorderedCategories[currentIndex], reorderedCategories[newIndex]] = 
  [reorderedCategories[newIndex], reorderedCategories[currentIndex]];

  // Preparar las actualizaciones con los nuevos órdenes
  const updates = reorderedCategories.map((category, index) => ({
    key: category.id,
    changes: { order: index + 1 }
  }));

  try {
    await db.categories.bulkUpdate(updates);
    console.log('Categorías reordenadas exitosamente');
  } catch (error) {
    console.error("Error al reordenar categorías:", error);
    alert("Error al reordenar las categorías");
  }
};

  if (!sortedCategories || !activeCategory) {
    return <div>Cargando...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <button 
          className="admin-toggle-button"
          onMouseDown={handleButtonPressStart}
          onMouseUp={handleButtonPressEnd}
          onMouseLeave={handleButtonPressEnd}
          onTouchStart={handleButtonPressStart}
          onTouchEnd={handleButtonPressEnd}
        >
          ⚙️
        </button>
        
        <div className={`app-main-view ${adminMode ? 'shifted' : ''}`}>
          <SentenceStrip selectedImages={sentence} onClear={clearSentence} />
          <div className="main-content">
            <CategoryTabs 
              categories={sortedCategories} 
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory} 
            />
            <ImageGrid 
              images={displayedImages}
              onImageClick={handleImageClick}
              adminMode={adminMode}
              onImageDelete={handleImageDelete}
              onImageEdit={(image) => setImageToEdit(image)}
            />
          </div>
        </div>

        <AdminPanel 
          isOpen={adminMode}
          onClose={() => setAdminMode(false)}
          categories={sortedCategories}
          onCategoryOrderChange={handleCategoryOrderChange}
        />
        
        <EditImageModal 
          image={imageToEdit}
          categories={sortedCategories}
          onSave={handleImageUpdate}
          onCancel={() => setImageToEdit(null)}
        />

        {maximizedImage && (
          <div className="maximizer-overlay" onClick={() => setMaximizedImage(null)}>
            <div className="image-card maximizer-content">
              {maximizedImage.imageData ? (
                <img src={maximizedImage.imageData} alt={maximizedImage.name} className="image-placeholder" />
              ) : (
                <div className="image-placeholder"></div>
              )}
              <p>{maximizedImage.name}</p>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default App;

