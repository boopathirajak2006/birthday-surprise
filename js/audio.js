/**
 * Audio Manager for Birthday Surprise Website
 * Handles background music, sound effects (pop, camera shutter),
 * and audio HUD UI states.
 */

import { CONFIG } from './config.js';

class AudioManager {
  constructor() {
    this.bgMusic = new Audio();
    this.bgMusic.src = (CONFIG && CONFIG.song && CONFIG.song.url)
      ? CONFIG.song.url
      : 'audio/WhatsApp Audio 2026-10-20 at 10.52.28 PM.mpeg';
    this.bgMusic.loop = true;
    this.bgMusic.preload = 'auto';

    let fallbackTriggered = false;
    this.bgMusic.addEventListener('error', () => {
      if (!fallbackTriggered) {
        fallbackTriggered = true;
        this.bgMusic.src = 'audio/WhatsApp Audio 2026-10-20 at 10.52.28 PM.mp3';
        this.bgMusic.load();
        if (this.isPlaying) {
          this.bgMusic.play().catch(() => {});
        }
      }
    });

    this.shutterAudio = new Audio();
    this.shutterAudio.src = 'assets/audio/shutter.mp3';
    this.shutterAudio.preload = 'auto';

    this.isPlaying = false;
    this.userInteracted = false;
    this.listeners = [];

    // Web Audio synthesizer for all interactive sound effects
    this.audioCtx = null;
  }

  init() {
    const startAudio = () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        this.play().catch(() => {});
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('touchstart', startAudio);
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };

    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('touchstart', startAudio);
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
  }

  onStateChange(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.isPlaying));
  }

  async play() {
    try {
      await this.bgMusic.play();
      this.isPlaying = true;
      this.notify();
    } catch (err) {
      console.warn('Audio play restricted until user gesture:', err);
      this.isPlaying = false;
      this.notify();
    }
  }

  pause() {
    this.bgMusic.pause();
    this.isPlaying = false;
    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 1. Soft UI button click
  playClick() {
    try {
      this.synthClick();
    } catch (e) {}
  }

  // 2. Gentle bubbly pop for balloons & special unlocks
  playPop() {
    try {
      this.synthPop();
    } catch (e) {}
  }

  // 3. Tactile soft tap for keypad digits
  playTap() {
    try {
      this.synthTap();
    } catch (e) {}
  }

  // 4. Romantic paper rustle & sparkle for letter opening
  playLetterOpen() {
    try {
      this.synthLetterOpen();
    } catch (e) {}
  }

  // 5. Crisp card flip for match game
  playCardFlip() {
    try {
      this.synthCardFlip();
    } catch (e) {}
  }

  // 6. Camera shutter sound - EXCLUSIVELY for camera taking a photograph
  playShutter() {
    try {
      if (this.shutterAudio) {
        const clone = this.shutterAudio.cloneNode();
        clone.volume = 0.9;
        clone.play().catch(() => this.synthShutter());
      } else {
        this.synthShutter();
      }
    } catch (e) {
      this.synthShutter();
    }
  }

  // 7. Success / reward chime chord
  playChime() {
    try {
      this.synthChime();
    } catch (e) {}
  }

  // Web Audio synthesizer with automatic context management
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Soft elegant button click (gentle acoustic bandpass transient)
  synthClick() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.2, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.038);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.038);
  }

  // True bubbly pop (smooth pitch drop, soft sine)
  synthPop() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.085);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  // Subtle muted keypad tap
  synthTap() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.032);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.032);
  }

  // Romantic paper unfolding rustle + crystalline sparkle
  synthLetterOpen() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Filtered noise for paper rustle
    const bufSize = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const envelope = Math.sin((i / bufSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.14;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1700, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + 0.16);
    filter.Q.setValueAtTime(1.6, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Warm harp chime sparkle
    const chimeNotes = [783.99, 1046.50]; // G5, C6
    chimeNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      const startT = now + 0.05 + i * 0.06;
      osc.frequency.setValueAtTime(freq, startT);
      g.gain.setValueAtTime(0.1, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + 0.32);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.32);
    });
  }

  // Crisp card flip for memory match game
  synthCardFlip() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.045);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Vintage mechanical camera shutter synthesized fallback
  synthShutter() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    noise.connect(filter);
    filter.connect(ctx.destination);
    noise.start(now);

    const noise2 = ctx.createBufferSource();
    noise2.buffer = buffer;
    noise2.connect(filter);
    noise2.start(now + 0.09);
  }

  // Celebratory crystalline harmonic chime
  synthChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });
  }
}

export const audio = new AudioManager();
if (typeof window !== 'undefined') {
  window.audio = audio;
}
