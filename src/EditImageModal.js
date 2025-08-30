import React, { useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';
import { generateAudio } from './utils';
import { GEMINI_API_KEY } from './config';

// --- Imports de Firebase ---
import { db, storage } from './firebase';
import { ref as dbRef, update } from "firebase/database";
import { ref as storageRef, uploadString, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";

function EditImageModal({ image, categories, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageData, setImageData] = useState(''); // Contendrá la URL o los datos de la nueva imagen
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (image) {
      setName(image.name);
      setCategoryId(image.categoryId);
      setImageData(image.imageData);
    }
  }, [image]);

  if (!image) return null;
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageToCrop(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedDataUrl) => {
    setImageData(croppedDataUrl); // Actualiza la vista previa con la nueva imagen
    setImageToCrop(null);
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    setIsSaving(true);
    try {
      const updates = {};
      const nameChanged = name.trim() !== image.name;

      // 1. Si la imagen cambió (es un data URL)
      if (imageData.startsWith('data:image')) {
        const oldImageRef = storageRef(storage, image.imageData);
        await deleteObject(oldImageRef).catch(e => console.warn("No se encontró la imagen anterior", e));
        
        const newImageFileName = `${Date.now()}-${name.trim()}.jpeg`;
        const newImageStorageRef = storageRef(storage, `images/${newImageFileName}`);
        const uploadResult = await uploadString(newImageStorageRef, imageData, 'data_url');
        updates[`/images/${image.id}/imageData`] = await getDownloadURL(uploadResult.ref);
      }

      // 2. Si el nombre cambió, actualiza el nombre y el audio
      if (nameChanged) {
        updates[`/images/${image.id}/name`] = name.trim();
        
        if (image.audioData) {
            const oldAudioRef = storageRef(storage, image.audioData);
            await deleteObject(oldAudioRef).catch(e => console.warn("No se encontró el audio anterior", e));
        }
        
        const audioBlob = await generateAudio(name.trim(), GEMINI_API_KEY);
        const audioFileName = `${Date.now()}-${name.trim()}.mp3`;
        const audioStorage = storageRef(storage, `audio/${audioFileName}`);
        await uploadBytes(audioStorage, audioBlob);
        updates[`/images/${image.id}/audioData`] = await getDownloadURL(audioStorage);
      }
      
      // 3. Si la categoría cambió
      if (categoryId !== image.categoryId) {
          updates[`/images/${image.id}/categoryId`] = categoryId;
      }

      // 4. Aplica las actualizaciones a la base de datos si hay cambios
      if (Object.keys(updates).length > 0) {
          await update(dbRef(db, '/'), updates);
      }
      
      onSave();
    } catch (error) {
      console.error("Error al actualizar la imagen:", error);
      alert("No se pudo actualizar la imagen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {imageToCrop && (
        <ImageCropper 
          imageToCrop={imageToCrop}
          onCropComplete={onCropComplete}
          onCancel={() => {
              setImageToCrop(null);
              setImageData(image.imageData); // Revierte la vista previa si se cancela
          }}
        />
      )}

      <div className="edit-modal-overlay">
        <div className="edit-modal-content">
          <h2>Editar Imagen</h2>
          <div className="form-group">
            <label>Nombre:</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isSaving} />
          </div>
          <div className="form-group">
            <label>Categoría:</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={isSaving}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cambiar imagen (opcional):</label>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSaving} />
          </div>
          <div className="form-group">
            <label>Vista previa actual:</label>
            <img src={imageData} alt="Vista previa" style={{ maxWidth: '150px', border: '1px solid #ccc' }}/>
          </div>
          <div className="edit-modal-buttons">
            <button onClick={onCancel} className="cancel-button" disabled={isSaving}>Cancelar</button>
            <button onClick={handleSave} className="save-button" disabled={isSaving}>
              {isSaving ? <div className="spinner"></div> : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditImageModal;

