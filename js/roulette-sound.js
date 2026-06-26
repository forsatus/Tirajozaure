/**
 * Sons de roulette synthétisés (Web Audio API) — clic mécanique à chaque case,
 * fanfare « tada » (ou easter egg) à la fin d'un tirage.
 */
const FART_SOUND_URL = "assets/sounds/dragon-studio-wet-fart-335478.mp3";

export class RouletteSound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.fartBuffer = null;
    this.fartLoadPromise = null;
  }

  unlock() {
    this._ensureContext();
    this._loadFartBuffer();
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * @param {number} delay délai en secondes avant lecture
   */
  playTick(delay = 0) {
    if (!this.enabled) return;

    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const volume = 0.12;
    const duration = 0.035 + Math.random() * 0.012;

    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(volume, now + 0.001);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400 + Math.random() * 900;
    filter.Q.value = 1.8 + Math.random() * 0.8;

    noise.connect(filter);
    filter.connect(master);
    noise.start(now);
    noise.stop(now + duration);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 650 + Math.random() * 350;

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Fanfare « tada » (style victoire au solitaire) à la fin d'un tirage.
   * 1 chance sur 10 : bruit de proute à la place.
   * @param {number} delay délai en secondes avant lecture
   */
  playWin(delay = 0) {
    if (!this.enabled) return;

    if (Math.random() < 1 / 10) {
      this.playFart(delay);
      return;
    }

    this._playTada(delay);
  }

  /**
   * @param {number} delay délai en secondes avant lecture
   */
  _playTada(delay = 0) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const volume = 0.22;

    const melody = [
      { freq: 523.25, start: 0, duration: 0.14 },
      { freq: 659.25, start: 0.1, duration: 0.14 },
      { freq: 783.99, start: 0.2, duration: 0.14 },
      { freq: 1046.5, start: 0.3, duration: 0.55 },
    ];

    melody.forEach(({ freq, start, duration }) => {
      const t = now + start;

      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.008);
      gain.gain.setValueAtTime(volume * 0.85, t + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.value = 0.7;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + duration + 0.05);
    });

    const chordStart = now + 0.42;
    const chordDuration = 0.65;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, chordStart);

      const gain = ctx.createGain();
      const noteVolume = volume * 0.35;
      gain.gain.setValueAtTime(0, chordStart);
      gain.gain.linearRampToValueAtTime(noteVolume, chordStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + chordDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordStart + i * 0.008);
      osc.stop(chordStart + chordDuration + 0.05);
    });
  }

  /**
   * Bruit de proute (fichier MP3, easter egg).
   * @param {number} delay délai en secondes avant lecture
   */
  playFart(delay = 0) {
    void this._playFart(delay);
  }

  async _loadFartBuffer() {
    if (this.fartBuffer) return this.fartBuffer;

    const ctx = this._ensureContext();
    if (!ctx) return null;

    if (!this.fartLoadPromise) {
      this.fartLoadPromise = fetch(FART_SOUND_URL)
        .then((res) => {
          if (!res.ok) throw new Error("Fichier son introuvable");
          return res.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          this.fartBuffer = buffer;
          return buffer;
        })
        .catch(() => null)
        .finally(() => {
          this.fartLoadPromise = null;
        });
    }

    return this.fartLoadPromise;
  }

  async _playFart(delay = 0) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const buffer = await this._loadFartBuffer();
    if (!buffer) return;

    const now = ctx.currentTime + delay;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    gain.connect(ctx.destination);

    source.connect(gain);
    source.start(now);
  }
}

export const rouletteSound = new RouletteSound();
