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

  // Cargar categorías en tiempo real desde Firebase
  useEffect(() => {
    const categoriesQuery = query(ref(db, 'categories'), orderByChild('order'));
    const unsubscribe = onValue(categoriesQuery, (snapshot) => {
      const data = snapshot.val();
      const categoriesList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setCategories(categoriesList);

      if (isLoading && categoriesList.length > 0) {
        setActiveCategory(categoriesList[0]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar categorías:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [isLoading]);

  // Cargar imágenes en tiempo real desde Firebase
  useEffect(() => {
    const imagesQuery = query(ref(db, 'images'), orderByChild('order'));
    const unsubscribe = onValue(imagesQuery, (snapshot) => {
      const data = snapshot.val();
      const imagesList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
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
    if (adminMode || maximizedImage || sentence.some(item => item.id === image.id)) return;
    setMaximizedImage(image);
    setSentence([...sentence, image]);
    setTimeout(() => setMaximizedImage(null), 1500);
  };

  const clearSentence = () => setSentence([]);

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
    if (!result.destination) return;
    const currentImages = Array.from(displayedImages);
    const [movedImage] = currentImages.splice(result.source.index, 1);
    currentImages.splice(result.destination.index, 0, movedImage);
    const updates = {};
    currentImages.forEach((img, index) => {
      updates[`/images/${img.id}/order`] = index + 1;
    });
    update(ref(db), updates).catch(err => console.error("Fallo al reordenar:", err));
  };

  const handleCategoryOrderChange = async (categoryId, direction) => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    
    const reordered = [...categories];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    const updates = {};
    reordered.forEach((cat, index) => {
      updates[`/categories/${cat.id}/order`] = index + 1;
    });
    await update(ref(db), updates);
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
          <SentenceStrip selectedImages={sentence} onClear={clearSentence} />
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
          onCategoryOrderChange={handleCategoryOrderChange}
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

