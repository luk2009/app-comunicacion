// src/PinModal.js

import React, { useState, useEffect } from 'react';

function PinModal({ onPinSubmit, onClose }) {
  const [pin, setPin] = useState('');
  const PIN_LENGTH = 4;

  useEffect(() => {
    // Si el PIN alcanza la longitud deseada, lo enviamos automáticamente
    if (pin.length === PIN_LENGTH) {
      onPinSubmit(pin);
      // Limpiamos el PIN después de un breve instante para que el usuario vea el feedback
      setTimeout(() => setPin(''), 300);
    }
  }, [pin, onPinSubmit]);

  const handleNumberClick = (num) => {
    if (pin.length < PIN_LENGTH) {
      setPin(pin + num);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  // Representación visual del PIN introducido
  const pinDots = [];
  for (let i = 0; i < PIN_LENGTH; i++) {
    pinDots.push(
      <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}></div>
    );
  }

  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="pin-modal-overlay" onClick={onClose}>
      <div className="pin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Modo Administrador</h2>
        <p>Introduce tu PIN para continuar</p>
        <div className="pin-display">
          {pinDots}
        </div>
        <div className="pin-keypad">
          {keypadNumbers.map(num => (
            <button key={num} onClick={() => handleNumberClick(num)} className="pin-button">
              {num}
            </button>
          ))}
          <button onClick={handleClear} className="pin-button utility">C</button>
          <button onClick={() => handleNumberClick('0')} className="pin-button">0</button>
          <button onClick={handleBackspace} className="pin-button utility">⌫</button>
        </div>
      </div>
    </div>
  );
}

export default PinModal;