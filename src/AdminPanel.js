import React, { useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';
import { generateAudio } from './utils';
import { GEMINI_API_KEY } from './config';

// --- Imports de Firebase ---
import { db, storage } from './firebase';
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { ref as dbRef, push, set, remove, get, update } from "firebase/database";

function AdminPanel({ isOpen, onClose, categories, images, onCategoryOrderChange }) {
  const [imageName, setImageName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageToCrop, setImageToCrop] = useState(null);
  const [croppedImageData, setCroppedImageData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageToCrop(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedData) => {
    setCroppedImageData(croppedData);
    setImageToCrop(null);
  };

  const handleSave = async () => {
    if (!imageName.trim() || !selectedCategory || !croppedImageData) {
      alert('Por favor, completa el nombre, la categoría y recorta una imagen.');
      return;
    }
    setIsSaving(true);
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "TU_API_KEY_AQUI") {
        throw new Error("API Key no configurada.");
      }

      // 1. Subir imagen a Storage
      const imageFileName = `${Date.now()}-${imageName.trim()}.jpeg`;
      const imageStorage = storageRef(storage, `images/${imageFileName}`);
      const uploadResult = await uploadString(imageStorage, croppedImageData, 'data_url');
      const imageDownloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Generar y subir audio
      const audioBlob = await generateAudio(imageName.trim(), GEMINI_API_KEY);
      const audioFileName = `${Date.now()}-${imageName.trim()}.mp3`;
      const audioStorage = storageRef(storage, `audio/${audioFileName}`);
      await uploadBytes(audioStorage, audioBlob);
      const audioDownloadURL = await getDownloadURL(audioStorage);

      // 3. Guardar en Realtime Database
      const imageCountInCategory = images.filter(img => img.categoryId === selectedCategory).length;
      const imagesListRef = dbRef(db, 'images');
      const newImageRef = push(imagesListRef);
      
      await set(newImageRef, {
        categoryId: selectedCategory,
        name: imageName.trim(),
        imageData: imageDownloadURL,
        audioData: audioDownloadURL,
        order: imageCountInCategory + 1,
      });

      alert('¡Imagen guardada con éxito!');
      // Resetear
      setImageName('');
      setCroppedImageData(null);
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = null;

    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      alert('Hubo un error al guardar la imagen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const categoriesRef = dbRef(db, 'categories');
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, {
        name: newCategoryName.trim(),
        order: categories.length + 1,
      });
      setNewCategoryName('');
    } catch (error) {
      console.error("Error al añadir categoría:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
      if (window.confirm('¿Eliminar esta categoría y TODAS sus imágenes? Esta acción no se puede deshacer.')) {
        try {
            const imagesToDeleteRef = dbRef(db, 'images');
            const snapshot = await get(imagesToDeleteRef);

            if (snapshot.exists()) {
                const allImages = snapshot.val();
                const updates = {};
                const storageDeletePromises = [];

                Object.keys(allImages).forEach(key => {
                    if (allImages[key].categoryId === categoryId) {
                        updates[key] = null; 
                        
                        const imageToDeleteStorageRef = storageRef(storage, allImages[key].imageData);
                        storageDeletePromises.push(deleteObject(imageToDeleteStorageRef).catch(e => console.error("Error borrando imagen de storage", e)));
                        
                        if(allImages[key].audioData){
                           const audioToDeleteStorageRef = storageRef(storage, allImages[key].audioData);
                           storageDeletePromises.push(deleteObject(audioToDeleteStorageRef).catch(e => console.error("Error borrando audio de storage", e)));
                        }
                    }
                });
                
                if(Object.keys(updates).length > 0){
                   await update(imagesToDeleteRef, updates);
                }
                // Espera a que todas las promesas de borrado de storage se completen
                await Promise.all(storageDeletePromises);
            }

            // Eliminar categoría de la base de datos
            await remove(dbRef(db, `categories/${categoryId}`));

        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            alert('Hubo un error al eliminar la categoría.');
        }
    }
  };

  return (
    <> 
      {imageToCrop && (
        <ImageCropper 
          imageToCrop={imageToCrop}
          onCropComplete={onCropComplete}
          onCancel={() => setImageToCrop(null)}
        />
      )}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
            <h2>Modo Administrador</h2>
            <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="admin-sidebar-content">
            <h3>Añadir Nueva Imagen</h3>
            <div className="form-group">
                <label>Nombre de la imagen:</label>
                <input type="text" value={imageName} onChange={(e) => setImageName(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="form-group">
                <label>Categoría:</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={isSaving}>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>1. Selecciona el archivo:</label>
                <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} disabled={isSaving}/>
            </div>
            {croppedImageData && (
                <div className="form-group">
                    <label>2. Vista previa recortada:</label>
                    <img src={croppedImageData} alt="Vista previa" style={{ maxWidth: '150px', border: '1px solid #ccc' }}/>
                </div>
            )}
            <button onClick={handleSave} className="save-button" disabled={isSaving}>
              {isSaving ? <div className="spinner"></div> : 'Guardar Imagen'}
            </button>
            <hr className="separator"/>
            <h3>Gestionar Categorías</h3>
            <div className="category-management">
              <div className="form-group">
                  <input type="text" placeholder="Nombre de la nueva categoría" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}/>
                  <button onClick={handleAddCategory} className="add-button">Añadir Categoría</button>
              </div>
              <ul className="category-list">
                  {categories.map((cat, index) => (
                  <li key={cat.id} className="category-item">
                      <div className="category-order-buttons">
                          <button onClick={() => onCategoryOrderChange(cat.id, 'up')} disabled={index === 0} className="order-button">🔼</button>
                          <button onClick={() => onCategoryOrderChange(cat.id, 'down')} disabled={index === categories.length - 1} className="order-button">🔽</button>
                      </div>
                      {/* --- CORRECCIÓN AQUÍ --- */}
                      <span className="category-name">{cat.name}</span>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="delete-button">Eliminar</button>
                  </li>
                  ))}
              </ul>
            </div>
        </div>
      </div>
    </>
  );
}

export default AdminPanel;

