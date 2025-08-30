import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';

// Función para centrar el recorte por defecto
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function ImageCropper({ imageToCrop, onCropComplete, onCancel }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const aspect = 1; // Proporción 1:1 (cuadrada)

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  async function handleCrop() {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      // Función para obtener la imagen recortada
      const croppedImageUrl = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'newFile.jpeg' // nombre del archivo temporal
      );
      onCropComplete(croppedImageUrl);
    }
  }

  // Esta función es la magia que recorta la imagen
  function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg'));
    });
  }

  return (
    <div className="cropper-overlay">
      <div className="cropper-modal">
        {imageToCrop && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageToCrop}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}
        <div className="cropper-buttons">
            <button type="button" onClick={onCancel} className="cancel-button">Cancelar</button>
            <button type="button" onClick={handleCrop} className="save-button">Recortar y Usar</button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
