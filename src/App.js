import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CategoryTabs from './CategoryTabs';
import ImageGrid from './ImageGrid';
import SentenceStrip from './SentenceStrip';
import AdminPanel from './AdminPanel';
import EditImageModal from './EditImageModal';
import { DragDropContext } from '@hello-pangea/dnd';

// --- Imports de Firebase ---
import { db, storage } from './firebase';
import { ref, onValue, query, orderByChild, update, remove } from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";

function App() {
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sentence, setSentence] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [maximizedImage, setMaximizedImage] = useState(null);
  const [imageToEdit, setImageToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);

  // Carga de categorías
  useEffect(() => {
    const categoriesQuery = query(ref(db, 'categories'), orderByChild('order'));
    const unsubscribe = onValue(categoriesQuery, (snapshot) => {
      const categoriesList = [];
      snapshot.forEach(child => {
        categoriesList.push({ id: child.key, ...child.val() });
      });
      setCategories(categoriesList);
      if (isLoading && categoriesList.length > 0 && !activeCategory) {
        setActiveCategory(categoriesList[0]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar categorías:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [isLoading, activeCategory]);

  // Carga de imágenes
  useEffect(() => {
    const imagesQuery = query(ref(db, 'images'), orderByChild('order'));
    const unsubscribe = onValue(imagesQuery, (snapshot) => {
      const imagesList = [];
      snapshot.forEach(child => {
        imagesList.push({ id: child.key, ...child.val() });
      });
      setImages(imagesList);
    }, (error) => {
      console.error("Error al cargar imágenes:", error);
    });
    return () => unsubscribe();
  }, []);

  const displayedImages = React.useMemo(() => {
    if (!activeCategory) return [];
    return images.filter(img => img.categoryId === activeCategory.id);
  }, [images, activeCategory]);

  const longPressTimer = useRef();

  const handleButtonPressStart = () => {
    longPressTimer.current = setTimeout(() => setAdminMode(true), 1500);
  };

  const handleButtonPressEnd = () => clearTimeout(longPressTimer.current);

  const handleImageClick = (image) => {
    if (adminMode || maximizedImage) return;
    const imageWithInstanceId = { ...image, instanceId: `${image.id}-${Date.now()}` };
    setMaximizedImage(image);
    setSentence([...sentence, imageWithInstanceId]);
    setTimeout(() => setMaximizedImage(null), 1500);
  };
  
  const handleSentenceImageClick = (image) => {
    if (image.audioData) {
      const audio = new Audio(image.audioData);
      audio.play().catch(e => console.error("Error al reproducir el audio:", e));
    }
    setMaximizedImage(image);
    setTimeout(() => setMaximizedImage(null), 1500);
  };

  const clearSentence = () => setSentence([]);

  // --- AÑADIDO: Nueva función para quitar un pictograma de la frase ---
  const handleRemoveFromSentence = (instanceIdToRemove) => {
    setSentence(currentSentence => 
      currentSentence.filter(image => image.instanceId !== instanceIdToRemove)
    );
  };

  const handleImageDelete = async (image) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      try {
        await remove(ref(db, `images/${image.id}`));
        const imageStorage = storageRef(storage, image.imageData);
        await deleteObject(imageStorage).catch(e => console.warn(e));
        if (image.audioData) {
          const audioStorage = storageRef(storage, image.audioData);
          await deleteObject(audioStorage).catch(e => console.warn(e));
        }
      } catch (error) {
        console.error("Error al eliminar la imagen:", error);
        alert("No se pudo eliminar la imagen.");
      }
    }
  };

  // --- MODIFICADO: La función onDragEnd ahora maneja 3 casos ---
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // 1. Reordenar CATEGORÍAS
    if (source.droppableId === 'categories') {
      setIsReorderingCategories(true);
      const reordered = Array.from(categories);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setCategories(reordered);
      const updates = {};
      reordered.forEach((cat, index) => {
        updates[`/categories/${cat.id}/order`] = index + 1;
      });
      update(ref(db), updates)
        .catch(err => console.error("Fallo al reordenar categorías:", err))
        .finally(() => setIsReorderingCategories(false));
    }

    // 2. Reordenar IMÁGENES
    if (source.droppableId === 'image-grid') {
      const reorderedImages = Array.from(displayedImages);
      const [moved] = reorderedImages.splice(source.index, 1);
      reorderedImages.splice(destination.index, 0, moved);
      const updates = {};
      reorderedImages.forEach((img, index) => {
        updates[`/images/${img.id}/order`] = index + 1;
      });
      update(ref(db), updates).catch(err => console.error("Fallo al reordenar imágenes:", err));
    }

    // --- AÑADIDO: 3. Reordenar PICTOGRAMAS EN LA FRASE ---
    if (source.droppableId === 'sentence-strip') {
      const reorderedSentence = Array.from(sentence);
      const [moved] = reorderedSentence.splice(source.index, 1);
      reorderedSentence.splice(destination.index, 0, moved);
      setSentence(reorderedSentence); // Solo actualizamos el estado local, es muy rápido
    }
  };

  if (isLoading) {
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
        >⚙️</button>
        
        <div className={`app-main-view ${adminMode ? 'shifted' : ''}`}>
          <SentenceStrip 
            selectedImages={sentence} 
            onClear={clearSentence}
            onImageClick={handleSentenceImageClick} 
            // --- AÑADIDO: Pasamos la nueva función de eliminar ---
            onRemove={handleRemoveFromSentence}
          />
          <div className="main-content">
            <CategoryTabs 
              categories={categories} 
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
          categories={categories}
          images={images}
          isReorderingCategories={isReorderingCategories}
        />
        
        <EditImageModal 
          image={imageToEdit}
          categories={categories}
          onSave={() => setImageToEdit(null)}
          onCancel={() => setImageToEdit(null)}
        />

        {maximizedImage && (
          <div className="maximizer-overlay" onClick={() => setMaximizedImage(null)}>
            <div className="image-card maximizer-content">
              {maximizedImage.imageData ? <img src={maximizedImage.imageData} alt={maximizedImage.name} className="image-placeholder" /> : <div className="image-placeholder"></div>}
              <p>{maximizedImage.name}</p>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default App;