import React, { useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';
import { db } from './db';
import { generateAudio } from './utils';
import { GEMINI_API_KEY } from './config';

function EditImageModal({ image, categories, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageData, setImageData] = useState('');
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (image) {
      setName(image.name);
      setCategoryId(image.categoryId);
      setImageData(image.imageData);
    }
  }, [image]);

  if (!image) {
    return null;
  }
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedData) => {
    setImageData(croppedData);
    setImageToCrop(null);
  };
  
  const handleSave = async () => {
  // --- VALIDACIÓN ---
  if (!name.trim()) {
    alert('El nombre de la imagen no puede estar vacío.');
    return; 
  }

  setIsSaving(true);
  try {
    const updatedImagePayload = {
      name: name.trim(),
      categoryId: Number(categoryId),
      imageData
    };

    const shouldGenerateAudio = !image.audioData || name.trim() !== image.name;

    if (shouldGenerateAudio) {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "TU_API_KEY_AQUI") {
        alert("Error: Por favor, configura tu API Key en el archivo src/config.js.");
        setIsSaving(false);
        return;
      }

      // --- NUESTRO "ESPÍA" DE DIAGNÓSTICO ---
      console.log("Intentando generar audio para el texto:", `'${name.trim()}'`);

      const audioBlob = await generateAudio(name.trim(), GEMINI_API_KEY);
      updatedImagePayload.audioData = audioBlob;
    }

    await db.images.update(image.id, updatedImagePayload);
    onSave();
  } catch (error) {
    console.error("Error al actualizar la imagen:", error);
    alert("No se pudo actualizar la imagen. Revisa la consola para más detalles.");
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
          onCancel={() => setImageToCrop(null)}
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
            {imageData ? (
                 <img src={imageData} alt="Vista previa" style={{ maxWidth: '150px', border: '1px solid #ccc' }}/>
            ) : (
                <div style={{ width: '150px', height: '150px', border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}></div>
            )}
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