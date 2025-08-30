// src/utils.js

/**
 * Genera un archivo de audio a partir de un texto utilizando la API Text-to-Speech de Google.
 * @param {string} text El texto que se convertirá en voz.
 * @param {string} apiKey Tu clave de API de Google (GEMINI_API_KEY).
 * @returns {Promise<Blob>} Una promesa que se resuelve con un Blob de audio en formato MP3.
 */
export async function generateAudio(text, apiKey) {
  const API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  // --- CORRECCIÓN APLICADA AQUÍ ---
  // La voz 'es-US-Studio-B' es masculina. Hemos corregido el género.
  const voiceConfig = {
    languageCode: 'es-US',
    name: 'es-US-Studio-B',
    ssmlGender: 'MALE', // Corregido de 'FEMALE' a 'MALE'
  };

  const audioConfig = {
    audioEncoding: 'MP3',
  };

  const requestBody = {
    input: {
      text: text,
    },
    voice: voiceConfig,
    audioConfig: audioConfig,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de la API de Text-to-Speech:', errorData);
      // Modificamos el error para que muestre el mensaje específico de la API
      throw new Error(`Error en la API: ${errorData.error.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.audioContent) {
        throw new Error("La respuesta de la API no contiene 'audioContent'.");
    }

    const audioBytes = atob(data.audioContent);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }

    return new Blob([audioArray], { type: 'audio/mp3' });

  } catch (error) {
    console.error('No se pudo generar el audio:', error);
    throw error; 
  }
}