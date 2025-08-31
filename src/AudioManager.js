// src/AudioManager.js

class AudioManager {
  constructor() {
    this.audioCache = new Map(); // Mantenemos la caché para precargar
    this.isPlaying = false;
    this.currentAudio = null; // Referencia al audio actual
  }

  preloadAudio(audioUrl) {
    if (!audioUrl || this.audioCache.has(audioUrl)) return;

    // Creamos instancias temporales solo para la precarga en segundo plano
    const audio = new Audio();
    audio.src = audioUrl;
    // No agregamos al cache hasta que esté listo para evitar problemas
    audio.addEventListener('loadeddata', () => {
      this.audioCache.set(audioUrl, audio);
    }, { once: true });
  }

  playSingle(audioUrl) {
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        reject(new Error("No se proporcionó URL de audio."));
        return;
      }

      // CAMBIO FUNDAMENTAL: Crear un NUEVO elemento de audio para cada reproducción
      this.stopAll(); // Detiene cualquier reproducción anterior
      
      // Crear elemento de audio completamente nuevo
      const audioElement = new Audio();
      audioElement.preload = 'auto';
      this.currentAudio = audioElement;
      this.isPlaying = true;

      const onCanPlay = () => {
        // Verificar que este sigue siendo el audio actual
        if (this.currentAudio !== audioElement) {
          cleanup();
          return;
        }

        // SOLUCIÓN AL TIMING ISSUE: Usar el evento 'seeked'
        const onSeeked = () => {
          audioElement.removeEventListener('seeked', onSeeked);
          
          if (this.currentAudio !== audioElement) {
            cleanup();
            return;
          }

          audioElement.play()
            .then(() => {
              // Audio comenzado correctamente
            })
            .catch(error => {
              console.error("Error al ejecutar play():", error);
              this.isPlaying = false;
              this.currentAudio = null;
              cleanup();
              reject(error);
            });
        };

        // Configurar el listener antes de hacer el seek
        audioElement.addEventListener('seeked', onSeeked, { once: true });
        
        // Ahora establecer currentTime (esto disparará 'seeked' cuando esté listo)
        audioElement.currentTime = 0;
      };

      const onEnded = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        cleanup();
        resolve(); // La promesa se resuelve cuando el audio TERMINA
      };

      const onError = (error) => {
        console.error("Error en el elemento de audio:", error);
        this.isPlaying = false;
        this.currentAudio = null;
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        // Limpiar el elemento de audio
        audioElement.pause();
        audioElement.src = '';
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      };

      // Configurar eventos ANTES de asignar src
      audioElement.addEventListener('canplay', onCanPlay, { once: true });
      audioElement.addEventListener('ended', onEnded, { once: true });
      audioElement.addEventListener('error', onError, { once: true });

      // Finalmente, asignar la fuente (esto dispara la carga)
      audioElement.src = audioUrl;
    });
  }

  async playSequence(audioUrls, onProgress = null) {
    this.stopAll();
    this.isPlaying = true;
    
    for (let i = 0; i < audioUrls.length; i++) {
      if (!this.isPlaying) break; // Permite la cancelación
      const audioUrl = audioUrls[i];
      if (!audioUrl) continue;
      
      if (onProgress) onProgress(i);

      try {
        await this.playSingle(audioUrl);
        
        // Pequeña pausa entre audios para dar tiempo al cleanup
        if (i < audioUrls.length - 1 && this.isPlaying) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Error en la secuencia en el índice ${i}:`, error);
        this.stopAll();
        if (onProgress) onProgress(-1);
        return;
      }
    }

    this.isPlaying = false;
    if (onProgress) onProgress(-1);
  }

  stopAll() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
}

export const audioManager = new AudioManager();