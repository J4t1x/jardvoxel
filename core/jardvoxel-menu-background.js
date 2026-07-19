// ═══════════════════════════════════════════════════════════
// SPEC-070: Menu Voxel Background
// Animated 2D voxel-block canvas for menu/pause screens.
// 4 procedural patterns: rain, float, cascade, constellation.
// Isometric 3-face blocks, biome palette, adaptive FPS scaling.
// Performance target: 60 FPS desktop, 30+ FPS mobile.
// ═══════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  blockCount: 25,
  blockSize: { min: 20, max: 60 },
  speed: { min: 0.3, max: 1.2 },
  opacity: { min: 0.15, max: 0.35 },
  rotationSpeed: 0.002,
  patternInterval: 8000,
  colors: {
    grass:  ['#10b981', '#34d399', '#6ee7b7'],
    stone:  ['#6b7280', '#9ca3af', '#d1d5db'],
    water:  ['#3b82f6', '#60a5fa', '#93c5fd'],
    flower: ['#ec4899', '#f472b6', '#fbbf24'],
    purple: ['#7c3aed', '#a78bfa', '#c4b5fd'],
  },
};

const PATTERNS = ['rain', 'float', 'cascade', 'constellation'];

// Map pattern -> palette keys (per SPEC-070 §3.3)
const PATTERN_PALETTES = {
  rain:         ['grass', 'stone'],
  float:        ['water', 'purple'],
  cascade:      ['flower', 'grass'],
  constellation:['purple', 'stone'],
};

function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Lighten/darken a #rrggbb hex by a delta (-255..255)
function shadeHex(hex, delta) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + delta));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + delta));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + delta));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export class MenuVoxelBackground {
  constructor(canvas, options = {}) {
    if (typeof canvas === 'string') canvas = document.getElementById(canvas);
    this.canvas = canvas;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.config = { ...DEFAULT_CONFIG, ...options };
    // Adaptive block count — scale down on small screens / weak devices.
    this._baseBlockCount = this.config.blockCount;
    this.blocks = [];
    this.currentPattern = pick(PATTERNS);
    this.patternTimer = 0;
    this.lastTime = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fps = 60;
    this._running = false;
    this._rafId = 0;
    this._onResize = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this._onResize);
    // Seed initial blocks for the starting pattern.
    this._seedBlocks();
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this._dpr = dpr;
    // Scale block count to viewport area — fewer blocks on small screens.
    const area = window.innerWidth * window.innerHeight;
    const refArea = 1920 * 1080;
    const scale = Math.max(0.4, Math.min(1.0, area / refArea));
    this.config.blockCount = Math.max(10, Math.round(this._baseBlockCount * scale));
  }

  _pickColor() {
    const paletteKeys = PATTERN_PALETTES[this.currentPattern] || ['grass'];
    const palette = this.config.colors[pick(paletteKeys)] || this.config.colors.grass;
    return pick(palette);
  }

  _seedBlocks() {
    this.blocks = [];
    const n = this.config.blockCount;
    for (let i = 0; i < n; i++) {
      const b = this._newBlock();
      // Spread initial positions across the screen so we don't get a
      // synchronized "wave" of blocks entering at once on first frame.
      b.x = rand(0, this.canvas.width);
      b.y = rand(0, this.canvas.height);
      this.blocks.push(b);
    }
  }

  _newBlock() {
    const { min, max } = this.config.blockSize;
    const sizePx = rand(min, max) * (this._dpr || 1);
    const speedScale = (this._dpr || 1);
    const block = {
      x: 0, y: 0,
      size: sizePx,
      color: this._pickColor(),
      vx: 0, vy: 0,
      rotation: rand(0, Math.PI * 2),
      vRot: rand(-1, 1) * this.config.rotationSpeed,
      opacity: rand(this.config.opacity.min, this.config.opacity.max),
      targetOpacity: 0,
      life: 0,
      // Constellation pattern: fixed grid position + pulse
      gridX: 0, gridY: 0,
      pulsePhase: rand(0, Math.PI * 2),
    };
    this._applyPattern(block);
    return block;
  }

  _applyPattern(b) {
    const W = this.canvas.width, H = this.canvas.height;
    const speedScale = (this._dpr || 1);
    const sMin = this.config.speed.min * speedScale;
    const sMax = this.config.speed.max * speedScale;
    switch (this.currentPattern) {
      case 'rain':
        b.x = rand(0, W);
        b.y = rand(-H, 0);
        b.vx = 0;
        b.vy = rand(sMin, sMax) * 60; // px/s
        b.vRot = rand(-1, 1) * this.config.rotationSpeed;
        b.targetOpacity = rand(this.config.opacity.min, this.config.opacity.max);
        break;
      case 'float':
        b.x = rand(0, W);
        b.y = rand(0, H);
        b.vx = rand(-sMin, sMin) * 30;
        b.vy = -rand(sMin, sMax) * 40; // drift up
        b.vRot = 0;
        b.targetOpacity = rand(this.config.opacity.min, this.config.opacity.max);
        break;
      case 'cascade':
        b.x = Math.random() < 0.5 ? rand(-60, 0) : rand(W, W + 60);
        b.y = rand(0, H);
        const dir = b.x < 0 ? 1 : -1;
        b.vx = dir * rand(sMin, sMax) * 50;
        b.vy = rand(sMin, sMax) * 30;
        b.vRot = rand(-1, 1) * this.config.rotationSpeed * 1.5;
        b.targetOpacity = rand(this.config.opacity.min, this.config.opacity.max);
        break;
      case 'constellation':
        // Snap to a coarse grid
        const cols = 8, rows = 6;
        b.gridX = Math.floor(rand(0, cols)) * (W / cols) + (W / cols) / 2;
        b.gridY = Math.floor(rand(0, rows)) * (H / rows) + (H / rows) / 2;
        b.x = b.gridX;
        b.y = b.gridY;
        b.vx = 0; b.vy = 0; b.vRot = 0;
        b.pulsePhase = rand(0, Math.PI * 2);
        b.targetOpacity = rand(this.config.opacity.min, this.config.opacity.max);
        b.opacity = 0; // fade in
        break;
    }
  }

  _switchPattern() {
    let next;
    do { next = pick(PATTERNS); } while (next === this.currentPattern && PATTERNS.length > 1);
    this.currentPattern = next;
    // Fade out existing blocks, then re-seed with new pattern.
    for (const b of this.blocks) b.targetOpacity = 0;
    // Re-seed after a short fade — schedule via life timer trick:
    this._patternReseedTimer = 800; // ms
  }

  update(dtMs) {
    const dt = dtMs / 1000;
    const W = this.canvas.width, H = this.canvas.height;
    this.patternTimer += dtMs;
    if (this.patternTimer > this.config.patternInterval) {
      this._switchPattern();
      this.patternTimer = 0;
    }
    // After fade-out, re-seed blocks for the new pattern.
    if (this._patternReseedTimer !== undefined) {
      this._patternReseedTimer -= dtMs;
      if (this._patternReseedTimer <= 0) {
        this._seedBlocks();
        this._patternReseedTimer = undefined;
      }
    }

    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      b.life += dtMs;
      // Smooth opacity toward target (fade in/out).
      const fadeRate = 1.2; // per second
      if (b.opacity < b.targetOpacity) {
        b.opacity = Math.min(b.targetOpacity, b.opacity + fadeRate * dt);
      } else if (b.opacity > b.targetOpacity) {
        b.opacity = Math.max(0, b.opacity - fadeRate * dt);
      }

      if (this.currentPattern === 'constellation') {
        // Pulse opacity sinusoidally around target.
        const pulse = 0.5 + 0.5 * Math.sin(b.life / 1000 * 1.2 + b.pulsePhase);
        b.opacity = b.targetOpacity * pulse;
        // No positional movement.
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rotation += b.vRot * dt * 60;
      }

      // Cull off-screen blocks (with margin) and respawn for rain/cascade/float.
      const margin = b.size * 2;
      const offscreen =
        b.y > H + margin || b.y < -margin * 2 ||
        b.x < -margin || b.x > W + margin;
      if (offscreen && this.currentPattern !== 'constellation') {
        // Recycle: reset as a fresh block in the current pattern.
        this._applyPattern(b);
        b.opacity = 0;
      }

      // Remove fully-faded blocks during a pattern transition if not reseeded yet.
      if (this._patternReseedTimer !== undefined && b.opacity <= 0 && b.targetOpacity === 0) {
        this.blocks.splice(i, 1);
      }
    }

    // Adaptive FPS scaling: if FPS drops, reduce block count.
    this._fpsFrames++;
    this._fpsTime += dtMs;
    if (this._fpsTime >= 2000) {
      this._fps = (this._fpsFrames / this._fpsTime) * 1000;
      this._fpsFrames = 0;
      this._fpsTime = 0;
      if (this._fps < 30 && this.config.blockCount > 10) {
        this.config.blockCount = Math.max(10, this.config.blockCount - 3);
      }
    }
  }

  drawIsometricBlock(size, color) {
    const ctx = this.ctx;
    // Top face (lightest)
    ctx.fillStyle = shadeHex(color, 30);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.5, -size * 0.25);
    ctx.lineTo(0, 0);
    ctx.lineTo(-size * 0.5, -size * 0.25);
    ctx.closePath();
    ctx.fill();
    // Left face (darkest)
    ctx.fillStyle = shadeHex(color, -30);
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.25);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.5, size * 0.25);
    ctx.closePath();
    ctx.fill();
    // Right face (base color)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, -size * 0.25);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(size * 0.5, size * 0.25);
    ctx.closePath();
    ctx.fill();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const b of this.blocks) {
      if (b.opacity <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      this.drawIsometricBlock(b.size, b.color);
      ctx.restore();
    }
  }

  loop(timestamp) {
    if (!this._running) return;
    const dt = this.lastTime ? (timestamp - this.lastTime) : 16;
    this.lastTime = timestamp;
    // Clamp dt to avoid huge jumps after tab switch.
    this.update(Math.min(dt, 50));
    this.render();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    if (this._running || !this.canvas) return;
    this._running = true;
    this.lastTime = 0;
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.canvas = null;
    this.ctx = null;
    this.blocks = [];
  }
}
