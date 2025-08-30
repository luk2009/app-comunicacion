import React, { useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';

// Este modal recibe la imagen a editar, las categorías, y funciones para guardar/cancelar
function EditImageModal({ image, categories, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageData, setImageData] = useState('');

  const [imageToCrop, setImageToCrop] = useState(null);

  // Cuando el componente recibe una imagen para editar, rellena el formulario
  useEffect(() => {
    if (image) {
      setName(image.name);
      setCategoryId(image.categoryId);
      setImageData(image.imageData);
    }
  }, [image]);

  // Si no hay imagen para editar, no mostramos nada
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
    setImageData(croppedData); // Actualizamos la imagen con la nueva versión recortada
    setImageToCrop(null);
  };
  
  const handleSave = () => {
    const updatedImage = {
      ...image, // Mantenemos el ID original
      name,
      categoryId: Number(categoryId),
      imageData
    };
    onSave(updatedImage);
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
            <input type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Categoría:</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cambiar imagen (opcional):</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="form-group">
            <label>Vista previa actual:</label>
            <img src={imageData} alt="Vista previa" style={{ maxWidth: '150px', border: '1px solid #ccc' }}/>
          </div>
          <div className="edit-modal-buttons">
            <button onClick={onCancel} className="cancel-button">Cancelar</button>
            <button onClick={handleSave} className="save-button">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditImageModal;
