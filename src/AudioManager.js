// src/AudioManager.js

class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.audioCache = new Map();
    this.isPlaying = false;
  }

  // Precargar audio para evitar delays
  preloadAudio(audioUrl) {
    if (!audioUrl || this.audioCache.has(audioUrl)) return;
    
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioUrl;
    this.audioCache.set(audioUrl, audio);
  }

  // Reproducir un audio individual
  async playSingle(audioUrl) {
    if (!audioUrl) return false;

    this.stopAll();
    
    try {
      let audio = this.audioCache.get(audioUrl);
      
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.preload = 'auto';
        this.audioCache.set(audioUrl, audio);
      }

      audio.currentTime = 0;
      
      this.currentAudio = audio;
      this.isPlaying = true;

      await this.ensureAudioReady(audio);
      await audio.play();
      
      // Resuelve la promesa cuando el audio termina
      return new Promise(resolve => {
        audio.onended = () => {
          this.isPlaying = false;
          resolve(true);
        };
      });

    } catch (error) {
      console.error("Error reproduciendo audio:", error);
      this.isPlaying = false;
      return false;
    }
  }

  // Asegurar que el audio esté listo para reproducir
  ensureAudioReady(audio) {
    return new Promise((resolve, reject) => {
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA - suficiente para empezar a tocar
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        // Limpiar listeners para evitar fugas de memoria
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(new Error('Audio load timeout'));
      }, 5000); // 5 segundos de tiempo de espera

      const onCanPlay = () => {
        clearTimeout(timeoutId);
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        resolve();
      };

      const onError = (e) => {
        clearTimeout(timeoutId);
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(e);
      };

      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.load();
    });
  }

  // Reproducir secuencia de audios
  async playSequence(audioUrls, onProgress = null) {
    if (!audioUrls || audioUrls.length === 0) return false;

    this.stopAll();
    this.isPlaying = true;

    try {
      for (let i = 0; i < audioUrls.length; i++) {
        const audioUrl = audioUrls[i];
        if (!audioUrl) continue;

        if (onProgress) onProgress(i, audioUrls.length);

        let audio = this.audioCache.get(audioUrl);
        if (!audio) {
          audio = new Audio(audioUrl);
          audio.preload = 'auto';
          this.audioCache.set(audioUrl, audio);
        }

        audio.currentTime = 0;
        this.currentAudio = audio;

        await this.ensureAudioReady(audio);
        
        await new Promise((resolve, reject) => {
          const onEnded = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            resolve();
          };

          const onError = (e) => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            reject(e);
          };

          audio.addEventListener('ended', onEnded, { once: true });
          audio.addEventListener('error', onError, { once: true });
          
          audio.play().catch(reject);
        });
      }
      return true;
    } catch (error) {
      console.error("Error en secuencia de audio:", error);
      return false;
    } finally {
      this.isPlaying = false;
      if (onProgress) onProgress(-1, audioUrls.length); // Indicar que terminó
    }
  }

  stopAll() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
}

// Creamos una única instancia que se usará en toda la aplicación
export const audioManager = new AudioManager();