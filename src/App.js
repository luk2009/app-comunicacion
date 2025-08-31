import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CategoryTabs from './CategoryTabs';
import ImageGrid from './ImageGrid';
import SentenceStrip from './SentenceStrip';
import AdminPanel from './AdminPanel';
import EditImageModal from './EditImageModal';
import PinModal from './PinModal';
import { DragDropContext } from '@hello-pangea/dnd';
import { db, storage } from './firebase';
import { ref, onValue, query, orderByChild, update, remove } from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { audioManager } from './AudioManager';

const VIBRATION_ENABLED = true;

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
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  
  const CORRECT_PIN = '1234';

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
  
  useEffect(() => {
    displayedImages.forEach(image => {
      if (image.audioData) {
        audioManager.preloadAudio(image.audioData);
      }
    });
  }, [displayedImages]);

  const longPressTimer = useRef();

  const handleButtonPressStart = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setIsPinModalVisible(true);
    }, 1000);
  };

  const handleButtonPressEnd = () => clearTimeout(longPressTimer.current);

  const handlePinSubmit = (submittedPin) => {
    if (submittedPin === CORRECT_PIN) {
      setAdminMode(true);
      setIsPinModalVisible(false);
    } else {
      alert('PIN incorrecto. Inténtalo de nuevo.');
    }
  };

  const handleImageClick = async (image) => {
    if (adminMode || maximizedImage) return;

    const isAlreadyInSentence = sentence.some(imgInSentence => imgInSentence.id === image.id);
    if (isAlreadyInSentence) return;
    
    if (image.audioData) {
      await audioManager.playSingle(image.audioData);
    }

    if (VIBRATION_ENABLED && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    const imageWithInstanceId = { ...image, instanceId: `${image.id}-${Date.now()}` };
    setMaximizedImage(image);
    setSentence([...sentence, imageWithInstanceId]);
    setTimeout(() => setMaximizedImage(null), 1500);
  };
  
  const handleSentenceImageClick = async (image) => {
    if (image.audioData) {
      await audioManager.playSingle(image.audioData);
    }

    if (VIBRATION_ENABLED && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setMaximizedImage(image);
    setTimeout(() => setMaximizedImage(null), 1500);
  };

  const clearSentence = () => setSentence([]);

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

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

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
        .catch(err => console.error("Fallo al reordenar categorías en Firebase:", err))
        .finally(() => setIsReorderingCategories(false));
    }

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

    if (source.droppableId === 'sentence-strip') {
      const reorderedSentence = Array.from(sentence);
      const [moved] = reorderedSentence.splice(source.index, 1);
      reorderedSentence.splice(destination.index, 0, moved);
      setSentence(reorderedSentence);
    }
  };

  if (isLoading) { return <div>Cargando...</div>; }

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
            onRemove={handleRemoveFromSentence}
            activeImageId={maximizedImage?.id}
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
              activeImageId={maximizedImage?.id}
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
        
        {isPinModalVisible && (
          <PinModal 
            onClose={() => setIsPinModalVisible(false)}
            onPinSubmit={handlePinSubmit}
          />
        )}

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