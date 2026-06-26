/**
 * Sons de roulette synthétisés (Web Audio API) — clic mécanique à chaque case.
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
   * @param {number} intensity 0–1, lié à la vitesse angulaire instantanée
   * @param {number} delay délai en secondes avant lecture
   */
  playTick(intensity = 1, delay = 0) {
    if (!this.enabled) return;

    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const volume = 0.12 * Math.min(1, 0.35 + intensity * 0.65);
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
}

export const rouletteSound = new RouletteSound();
