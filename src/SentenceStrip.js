// src/SentenceStrip.js
import React from 'react';

function SentenceStrip({ selectedImages, onClear }) {

  // Esta función se encarga de hacer que el navegador hable
  const handleSpeak = () => {
    // Si no hay imágenes seleccionadas, no hacemos nada
    if (selectedImages.length === 0) return;

    // Juntamos los nombres de las imágenes en una sola frase
    const textToSpeak = selectedImages.map(image => image.name).join(' ');

    // Creamos un objeto de "enunciado" para la API de voz
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Opcional: puedes configurar el idioma si quieres
    utterance.lang = 'es-ES'; 

    // Usamos la API del navegador para leer la frase en voz alta
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="sentence-strip">
      {/* Botón para hablar */}
      <button onClick={handleSpeak} className="speak-button">
        ▶️
      </button>

      <div className="selected-images">
        {selectedImages.map((image, index) => (
          // Usamos el id de la imagen para la key, que es más robusto
          <div key={`${image.id}-${index}`} className="image-card-small">
            {image.name}
          </div>
        ))}
      </div>
      <button onClick={onClear} className="clear-button">X</button>
    </div>
  );
}

export default SentenceStrip;
