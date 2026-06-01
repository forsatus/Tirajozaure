const WHEEL_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export class Roulette {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.items = [];
    this.displayLabels = null;
    this.rotation = 0;
    this.spinning = false;
    this.size = options.size || 400;
    this.onSpinEnd = options.onSpinEnd || (() => {});
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  setItems(items, displayLabels = null) {
    this.items = items.filter((s) => s && String(s).trim());
    this.displayLabels =
      displayLabels && displayLabels.length === this.items.length
        ? displayLabels
        : null;
    this.draw();
  }

  getItems() {
    return [...this.items];
  }

  draw() {
    const { ctx, size, items, rotation } = this;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    if (items.length === 0) {
      ctx.fillStyle = "#243044";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Ajoutez des éléments", cx, cy);
      return;
    }

    const slice = (Math.PI * 2) / items.length;

    items.forEach((label, i) => {
      const start = rotation + i * slice;
      const end = start + slice;
      const displayText = this.displayLabels
        ? this.displayLabels[i]
        : label;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#0f1419";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${this._fontSize(items.length)}px sans-serif`;
      const text = this._truncate(displayText, items.length);
      ctx.fillText(text, radius - 12, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#1a2332";
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  _fontSize(count) {
    if (count <= 6) return 13;
    if (count <= 12) return 11;
    if (count <= 24) return 9;
    return 7;
  }

  _truncate(text, count) {
    const max = count <= 8 ? 28 : count <= 20 ? 18 : 12;
    const s = String(text);
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  /**
   * Lance la roulette et retourne l'index gagnant (pointeur en haut = -PI/2).
   */
  spin(targetIndex = null) {
    if (this.spinning || this.items.length === 0) {
      return Promise.resolve(null);
    }

    const index =
      targetIndex !== null && targetIndex >= 0 && targetIndex < this.items.length
        ? targetIndex
        : Math.floor(Math.random() * this.items.length);

    const slice = (Math.PI * 2) / this.items.length;
    const centerOfSlice = index * slice + slice / 2;
    const pointerAngle = -Math.PI / 2;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const targetRotation =
      pointerAngle - centerOfSlice + extraTurns * Math.PI * 2;

    const startRotation = this.rotation;
    const delta = targetRotation - startRotation;
    const duration = 4000 + Math.random() * 1500;
    const startTime = performance.now();

    this.spinning = true;

    return new Promise((resolve) => {
      const tick = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        this.rotation = startRotation + delta * eased;
        this.draw();

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          this.rotation = targetRotation % (Math.PI * 2);
          this.spinning = false;
          this.draw();
          const winner = this.items[index];
          this.onSpinEnd(winner, index);
          resolve({ winner, index });
        }
      };
      requestAnimationFrame(tick);
    });
  }

  isSpinning() {
    return this.spinning;
  }
}
