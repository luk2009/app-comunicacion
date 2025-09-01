// src/AudioManager.js

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.isPlaying = false;
    this.currentAudio = null;
  }

  preloadAudio(audioUrl) {
    if (!audioUrl || this.audioCache.has(audioUrl)) return;

    const audio = new Audio();
    audio.src = audioUrl;
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

      this.stopAll(); 
      
      const audioElement = new Audio();
      audioElement.preload = 'auto';
      this.currentAudio = audioElement;
      this.isPlaying = true;

      const onCanPlay = () => {
        if (this.currentAudio !== audioElement) {
          cleanup();
          return;
        }

        const onSeeked = () => {
          audioElement.removeEventListener('seeked', onSeeked);
          
          if (this.currentAudio !== audioElement) {
            cleanup();
            return;
          }

          audioElement.play()
            .then(() => {})
            .catch(error => {
              console.error("Error al ejecutar play():", error);
              this.isPlaying = false;
              this.currentAudio = null;
              cleanup();
              reject(error);
            });
        };

        audioElement.addEventListener('seeked', onSeeked, { once: true });
        audioElement.currentTime = 0;
      };

      const onEnded = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        cleanup();
        resolve();
      };

      // --- FUNCIÓN DE ERROR MEJORADA ---
      const onError = (event) => {
        // En lugar de devolver el '[object Event]', creamos un error descriptivo.
        const errorMessage = `No se pudo cargar el audio. Es posible que el archivo esté corrupto o haya un problema de red. URL: ${event.target.src}`;
        console.error("Error en el elemento de audio:", errorMessage);
        
        this.isPlaying = false;
        this.currentAudio = null;
        cleanup();
        reject(new Error(errorMessage)); // Devolvemos un objeto Error real.
      };

      const cleanup = () => {
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        audioElement.pause();
        audioElement.src = '';
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      };

      audioElement.addEventListener('canplay', onCanPlay, { once: true });
      audioElement.addEventListener('ended', onEnded, { once: true });
      audioElement.addEventListener('error', onError, { once: true });

      audioElement.src = audioUrl;
    });
  }

  async playSequence(audioUrls, onProgress = null) {
    // ... (El resto de la clase no cambia)
    this.stopAll();
    this.isPlaying = true;
    
    for (let i = 0; i < audioUrls.length; i++) {
      if (!this.isPlaying) break;
      const audioUrl = audioUrls[i];
      if (!audioUrl) continue;
      
      if (onProgress) onProgress(i);

      try {
        await this.playSingle(audioUrl);
        
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