'use client';

// Casino Sound Manager using Web Audio API for procedural audio generation
class SoundManager {
  private audioContext: AudioContext | null = null;
  private initialized: boolean = false;
  private masterVolume: number = 0.5;

  constructor() {
    if (typeof window === 'undefined') return;
    this.initAudio();
  }

  private initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Generate a beep tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.initialized) return;
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play a series of tones (arpeggio)
  private playArpeggio(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, duration, type, volume);
      }, i * (duration * 200));
    });
  }

  // Noise generator for crash/explosion sounds
  private playNoise(duration: number, volume: number = 0.5) {
    if (!this.audioContext || !this.initialized) return;
    this.ensureContext();

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    source.start();
  }

  // === CASINO SOUNDS ===

  // Soft tick for hover
  playHover() {
    this.playTone(2500, 0.03, 'sine', 0.15);
  }

  // Chip sounds for betting
  playBet() {
    // Multiple chip clicks
    [0, 30, 60].forEach((delay) => {
      setTimeout(() => {
        this.playTone(800 + Math.random() * 400, 0.05, 'triangle', 0.25);
      }, delay);
    });
  }

  // Jackpot win sound - ascending arpeggio
  playWin() {
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'square', 0.2);
        this.playTone(freq * 2, 0.15, 'sine', 0.1);
      }, i * 80);
    });
    
    // Final chord
    setTimeout(() => {
      [1046.50, 1318.51, 1567.98].forEach(freq => {
        this.playTone(freq, 0.5, 'sine', 0.15);
      });
    }, 500);
  }

  // Buzzer for loss
  playLose() {
    // Descending harsh tones
    [400, 300, 200].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sawtooth', 0.2);
      }, i * 100);
    });
  }

  // Cash register for cashout
  playCashout() {
    // Cha-ching!
    this.playTone(1200, 0.05, 'square', 0.25);
    setTimeout(() => {
      this.playTone(1800, 0.08, 'square', 0.25);
    }, 60);
    setTimeout(() => {
      this.playTone(2400, 0.15, 'sine', 0.3);
      this.playTone(1200, 0.15, 'sine', 0.15);
    }, 150);
    
    // Coin jingle
    [250, 300, 350, 400].forEach((delay) => {
      setTimeout(() => {
        this.playTone(3000 + Math.random() * 1000, 0.04, 'sine', 0.1);
      }, delay);
    });
  }

  // Explosion for crash
  playCrash() {
    this.playNoise(0.8, 0.6);
    this.playTone(80, 0.3, 'sawtooth', 0.4);
    
    setTimeout(() => {
      this.playTone(60, 0.4, 'sawtooth', 0.3);
    }, 100);
  }

  // Card flip
  playCardFlip() {
    this.playTone(1500, 0.03, 'sine', 0.2);
    setTimeout(() => {
      this.playTone(800, 0.05, 'triangle', 0.15);
    }, 30);
  }

  // Multiplier tick (as crash multiplier goes up)
  playMultiplierTick() {
    this.playTone(1200, 0.02, 'sine', 0.1);
  }

  // Multiplier milestone (whole number)
  playMultiplierMilestone() {
    this.playTone(800, 0.08, 'square', 0.2);
    this.playTone(1200, 0.08, 'square', 0.15);
  }

  // Countdown beep
  playCountdown() {
    this.playTone(880, 0.1, 'square', 0.25);
  }

  // Final countdown beep (game starting)
  playCountdownFinal() {
    this.playTone(1760, 0.2, 'square', 0.3);
  }

  // Button click
  playClick() {
    this.playTone(600, 0.04, 'square', 0.15);
  }

  // Deal cards sound
  playDeal() {
    [0, 100, 200, 300].forEach((delay, i) => {
      setTimeout(() => {
        this.playTone(800 + i * 100, 0.05, 'triangle', 0.2);
      }, delay);
    });
  }

  // Wallet connected celebration
  playWalletConnected() {
    const frequencies = [523.25, 659.25, 783.99]; // C-E-G chord
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.2);
      }, i * 50);
    });
  }

  // Error/warning sound
  playError() {
    this.playTone(200, 0.15, 'square', 0.25);
    setTimeout(() => {
      this.playTone(150, 0.2, 'square', 0.25);
    }, 150);
  }

  // Slider tick
  playSliderTick() {
    this.playTone(1000, 0.02, 'sine', 0.08);
  }

  // Set master volume (0-1)
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  // Mute/unmute
  mute() {
    this.masterVolume = 0;
  }

  unmute(volume: number = 0.5) {
    this.masterVolume = volume;
  }
}

// Singleton instance
let soundManager: SoundManager | null = null;

export const getSoundManager = (): SoundManager => {
  if (!soundManager && typeof window !== 'undefined') {
    soundManager = new SoundManager();
  }
  return soundManager!;
};

export default SoundManager;
