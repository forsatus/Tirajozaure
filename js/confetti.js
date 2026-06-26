const COLORS = ["#f59e0b", "#fbbf24", "#22c55e", "#3b82f6", "#ec4899", "#a855f7"];

let canvas = null;
let ctx = null;
/** @type {Array<object>} */
let particles = [];
let animating = false;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnBurst({ x, y, count = 100 }) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 10 + 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      life: 1,
    });
  }
}

function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.32;
    p.vx *= 0.985;
    p.life -= 0.011;

    if (p.life <= 0) return false;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.min(1, p.life * 1.2);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();

    p.rotation += p.rotationSpeed;
    return true;
  });

  if (particles.length > 0) {
    requestAnimationFrame(tick);
  } else {
    animating = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startAnimation() {
  if (animating) return;
  animating = true;
  requestAnimationFrame(tick);
}

/**
 * @param {{ origin?: { x: number, y: number }, count?: number }} [options]
 *   origin — position normalisée (0–1) sur l'écran
 */
export function burstConfetti(options = {}) {
  ensureCanvas();
  const { origin = { x: 0.5, y: 0.45 }, count = 100 } = options;
  spawnBurst({
    x: origin.x * canvas.width,
    y: origin.y * canvas.height,
    count,
  });
  startAnimation();
}

/** @param {Element} element */
export function burstConfettiFromElement(element) {
  if (!element) {
    burstConfetti();
    return;
  }
  const rect = element.getBoundingClientRect();
  burstConfetti({
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
    count: 120,
  });
}
