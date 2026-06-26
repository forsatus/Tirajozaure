/**
 * Sons de roulette synthétisés (Web Audio API) — clic mécanique à chaque case,
 * fanfare « tada » à la fin d'un tirage.
 */
export class RouletteSound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  unlock() {
    this._ensureContext();
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
   * @param {number} delay délai en secondes avant lecture
   */
  playWin(delay = 0) {
    if (!this.enabled) return;

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
}

export const rouletteSound = new RouletteSound();
