import React, { useState } from 'react';
import { db } from './db';
import ImageCropper from './ImageCropper';

// Aceptamos la nueva prop 'onCategoryOrderChange'
function AdminPanel({ isOpen, onClose, categories, onCategoryOrderChange }) {
  const [imageName, setImageName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  
  const [imageToCrop, setImageToCrop] = useState(null);
  const [croppedImageData, setCroppedImageData] = useState(null);

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
    setCroppedImageData(croppedData);
    setImageToCrop(null);
  };

  const handleSave = async () => {
    if (!imageName || !selectedCategory || !croppedImageData) {
      alert('Por favor, completa el nombre, la categoría y recorta una imagen.');
      return;
    }
    try {
      const imageCountInCategory = await db.images.where({ categoryId: Number(selectedCategory) }).count();
      await db.images.add({
        categoryId: Number(selectedCategory),
        name: imageName,
        imageData: croppedImageData,
        order: imageCountInCategory + 1,
      });
      alert('¡Imagen guardada con éxito!');
      setImageName('');
      setCroppedImageData(null);
      if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = null;
      }
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      alert('Hubo un error al guardar la imagen.');
    }
  };

  const [newCategoryName, setNewCategoryName] = useState('');
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('El nombre de la categoría no puede estar vacío.');
      return;
    }
    try {
      const categoryCount = await db.categories.count();
      await db.categories.add({ 
        name: newCategoryName.trim(),
        order: categoryCount + 1,
      });
      setNewCategoryName('');
    } catch (error) {
      console.error("Error al añadir categoría:", error);
      alert('Hubo un error al crear la categoría.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría y todas sus imágenes? Esta acción no se puede deshacer.')) {
      try {
        await db.transaction('rw', db.categories, db.images, async () => {
          await db.images.where({ categoryId: id }).delete();
          await db.categories.delete(id);
        });
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
                <input 
                    type="text" 
                    value={imageName} 
                    onChange={(e) => setImageName(e.target.value)} 
                />
            </div>
            <div className="form-group">
                <label>Categoría:</label>
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                </select>
            </div>
            <div className="form-group">
                <label>1. Selecciona el archivo:</label>
                <input 
                    type="file" 
                    id="file-input"
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
            </div>

            {croppedImageData && (
                <div className="form-group">
                    <label>2. Vista previa recortada:</label>
                    <img src={croppedImageData} alt="Vista previa" style={{ maxWidth: '150px', border: '1px solid #ccc' }}/>
                </div>
            )}

            <button onClick={handleSave} className="save-button">Guardar Imagen</button>

            <hr className="separator"/>

            <h3>Gestionar Categorías</h3>
            <div className="category-management">
              <div className="form-group">
                  <input 
                  type="text"
                  placeholder="Nombre de la nueva categoría"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button onClick={handleAddCategory} className="add-button">Añadir Categoría</button>
              </div>
              <ul className="category-list">
                  {categories.map((cat, index) => (
                  <li key={cat.id} className="category-item">
                      {/* --- NUEVOS BOTONES DE ORDEN --- */}
                      <div className="category-order-buttons">
                          <button 
                              onClick={() => onCategoryOrderChange(cat.id, 'up')}
                              disabled={index === 0}
                              className="order-button"
                          >
                              🔼
                          </button>
                          <button 
                              onClick={() => onCategoryOrderChange(cat.id, 'down')}
                              disabled={index === categories.length - 1}
                              className="order-button"
                          >
                              🔽
                          </button>
                      </div>
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

