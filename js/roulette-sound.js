/**
 * Sons de roulette synthétisés (Web Audio API) — clic mécanique à chaque case,
 * fanfare « tada » (ou easter egg) à la fin d'un tirage.
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
   * 1 chance sur 20 : bruit de proute avec écho à la place.
   * @param {number} delay délai en secondes avant lecture
   */
  playWin(delay = 0) {
    if (!this.enabled) return;

    if (Math.random() < 1 / 20) {
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
   * Bruit de proute synthétisé avec écho (easter egg).
   * @param {number} delay délai en secondes avant lecture
   */
  playFart(delay = 0) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const duration = 0.5 + Math.random() * 0.15;
    const volume = 0.38;

    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.65;

    const echoDelay = ctx.createDelay(1.2);
    echoDelay.delayTime.value = 0.16 + Math.random() * 0.06;

    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = 0.42;

    const echoWet = ctx.createGain();
    echoWet.gain.value = 0.55;

    const sourceGain = ctx.createGain();
    sourceGain.gain.setValueAtTime(0, now);
    sourceGain.gain.linearRampToValueAtTime(volume, now + 0.025);
    sourceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    sourceGain.connect(dry);
    sourceGain.connect(echoDelay);
    dry.connect(master);
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(echoWet);
    echoWet.connect(master);

    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      brown = brown * 0.96 + white * 0.12;
      const envelope = 1 - (i / bufferSize) * 0.55;
      data[i] = brown * envelope;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(280 + Math.random() * 80, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(55, now + duration * 0.9);
    noiseFilter.Q.value = 1.4;

    noise.connect(noiseFilter);
    noiseFilter.connect(sourceGain);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const startFreq = 95 + Math.random() * 45;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + duration * 0.88);

    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = "lowpass";
    oscFilter.frequency.value = 180;

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.75);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(sourceGain);

    noise.start(now);
    noise.stop(now + duration + 0.05);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

export const rouletteSound = new RouletteSound();
