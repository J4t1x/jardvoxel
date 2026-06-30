import Phaser from 'phaser';
import { COLORS } from '@config/balance';

interface AmbientParticle {
  text: Phaser.GameObjects.Text;
  vx: number;
  vy: number;
  baseAlpha: number;
}

interface CoinParticle {
  text: Phaser.GameObjects.Text;
  vy: number;
  vx: number;
  rotSpeed: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  decay: number;
  size: number;
  color: number;
  shape: 'star' | 'circle';
  rot: number;
  vr: number;
}

interface AuroraBlob {
  gfx: Phaser.GameObjects.Arc;
  baseX: number;
  baseY: number;
  phase: number;
}

interface StarParticle {
  text: Phaser.GameObjects.Text;
  phase: number;
}

interface DecoFruit {
  text: Phaser.GameObjects.Text;
  vx: number;
  vy: number;
  rotSpeed: number;
}

export class EffectsManager {
  private scene: Phaser.Scene;
  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private vignetteGraphics: Phaser.GameObjects.Graphics | null = null;
  private ambientParticles: AmbientParticle[] = [];
  private ambientTimer: Phaser.Time.TimerEvent | null = null;
  private lightRayGraphics: Phaser.GameObjects.Graphics | null = null;
  private lightRayPhase: number = 0;
  private lightRayFrameSkip: number = 0;
  private cachedGoldColor: number = 0;
  private lowPerf: boolean = false;
  private burstParticles: BurstParticle[] = [];
  private burstGraphics: Phaser.GameObjects.Graphics | null = null;
  private auroraBlobsData: AuroraBlob[] = [];
  private starParticles: StarParticle[] = [];
  private decoFruits: DecoFruit[] = [];
  private vignetteMode: 'normal' | 'fever' | 'jackpot' = 'normal';
  private vignettePulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAnimatedBackground(): void {
    const { width, height } = this.scene.cameras.main;
    this.scene.cameras.main.setBackgroundColor(COLORS.bg);
    this.cachedGoldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    this.detectPerfMode();

    this.bgGraphics = this.scene.add.graphics();
    this.bgGraphics.setDepth(-10);
    this.drawGradientBg(width, height);

    if (!this.lowPerf) {
      this.lightRayGraphics = this.scene.add.graphics();
      this.lightRayGraphics.setDepth(-5);
      this.scene.events.on('update', this.updateLightRays, this);
      this.spawnAmbientParticles();
      this.createAuroraBlobs();
      this.createTwinklingStars();
      this.createFloatingDecorations();
    }
  }

  private detectPerfMode(): void {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = navigator.maxTouchPoints > 0;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    this.lowPerf = isMobile || (hasTouch && isSmallScreen);
  }

  private drawGradientBg(width: number, height: number): void {
    if (!this.bgGraphics) return;
    this.bgGraphics.clear();

    const steps = 40;
    const c1 = Phaser.Display.Color.HexStringToColor(COLORS.bg);
    const c2 = Phaser.Display.Color.HexStringToColor('#1a0a2e');
    const c3 = Phaser.Display.Color.HexStringToColor('#0d1a2e');

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const lt = t * 2;
        r = Phaser.Math.Linear(c1.red, c2.red, lt);
        g = Phaser.Math.Linear(c1.green, c2.green, lt);
        b = Phaser.Math.Linear(c1.blue, c2.blue, lt);
      } else {
        const lt = (t - 0.5) * 2;
        r = Phaser.Math.Linear(c2.red, c3.red, lt);
        g = Phaser.Math.Linear(c2.green, c3.green, lt);
        b = Phaser.Math.Linear(c2.blue, c3.blue, lt);
      }
      const color = Phaser.Display.Color.GetColor(r, g, b);
      this.bgGraphics.fillStyle(color, 0.6);
      this.bgGraphics.fillRect(0, (i / steps) * height, width, height / steps + 1);
    }

    this.vignetteGraphics = this.scene.add.graphics();
    this.vignetteGraphics.setDepth(-9);
    this.vignetteGraphics.fillStyle(0x000000, 0.3);
    this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.7);
    this.vignetteGraphics.fillStyle(0x000000, 0);
    this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.3);
  }

  private updateLightRays = (): void => {
    if (!this.lightRayGraphics) return;
    this.lightRayFrameSkip++;
    if (this.lightRayFrameSkip < 3) return;
    this.lightRayFrameSkip = 0;

    const { width, height } = this.scene.cameras.main;
    this.lightRayPhase += 0.009;
    this.lightRayGraphics.clear();

    const cx = width / 2;
    const cy = height * 0.35;
    const rayCount = 4;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + this.lightRayPhase;
      const len = width * 0.6;
      const halfWidth = 50;
      const x1 = cx + Math.cos(angle) * 50;
      const y1 = cy + Math.sin(angle) * 50;
      const x2 = cx + Math.cos(angle) * len;
      const y2 = cy + Math.sin(angle) * len;
      const px = -Math.sin(angle);
      const py = Math.cos(angle);

      this.lightRayGraphics.fillStyle(this.cachedGoldColor, 0.012);
      this.lightRayGraphics.beginPath();
      this.lightRayGraphics.moveTo(x1 + px * halfWidth, y1 + py * halfWidth);
      this.lightRayGraphics.lineTo(x2 + px * halfWidth * 2, y2 + py * halfWidth * 2);
      this.lightRayGraphics.lineTo(x2 - px * halfWidth * 2, y2 - py * halfWidth * 2);
      this.lightRayGraphics.lineTo(x1 - px * halfWidth, y1 - py * halfWidth);
      this.lightRayGraphics.closePath();
      this.lightRayGraphics.fillPath();
    }
  };

  private spawnAmbientParticles(): void {
    const { width, height } = this.scene.cameras.main;
    const sparkleEmojis = ['✨', '⭐', '💫'];
    const maxParticles = 4;

    this.ambientTimer = this.scene.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => {
        if (this.ambientParticles.length >= maxParticles) return;
        const emoji = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
        const x = Math.random() * width;
        const y = height + 20;
        const text = this.scene.add.text(x, y, emoji, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
        }).setOrigin(0.5).setDepth(-3).setAlpha(0);

        const particle: AmbientParticle = {
          text,
          vx: (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 25,
          baseAlpha: 0.2 + Math.random() * 0.3,
        };
        this.ambientParticles.push(particle);

        this.scene.tweens.add({
          targets: text,
          alpha: particle.baseAlpha,
          duration: 1000,
        });
      },
    });

    this.scene.events.on('update', this.updateAmbientParticles, this);
  }

  private updateAmbientParticles = (): void => {
    const { width, height } = this.scene.cameras.main;
    const dt = this.scene.game.loop.delta / 1000;

    for (const p of this.ambientParticles) {
      p.text.x += p.vx * dt;
      p.text.y += p.vy * dt;
      p.text.alpha = p.baseAlpha * (0.5 + Math.sin(this.scene.time.now * 0.002 + p.text.x) * 0.5);

      if (p.text.y < -30) {
        p.text.destroy();
      }
    }
    this.ambientParticles = this.ambientParticles.filter((p) => p.text.active);
  };

  coinShower(count: number, duration: number = 2000): void {
    const { width, height } = this.scene.cameras.main;
    const coinEmojis = ['🪙', '💰', '💎', '⭐'];
    const actualCount = this.lowPerf ? Math.min(count, 15) : count;
    const coins: CoinParticle[] = [];

    for (let i = 0; i < actualCount; i++) {
      const x = Math.random() * width;
      const emoji = coinEmojis[Math.floor(Math.random() * coinEmojis.length)];
      const text = this.scene.add.text(x, -30 - Math.random() * 200, emoji, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${20 + Math.random() * 16}px`,
      }).setOrigin(0.5).setDepth(95 + Math.floor(Math.random() * 10));

      const coin: CoinParticle = {
        text,
        vy: 100 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 80,
        rotSpeed: (Math.random() - 0.5) * 720,
      };
      coins.push(coin);
    }

    const startTime = this.scene.time.now;
    const updateFn = () => {
      const elapsed = this.scene.time.now - startTime;
      const dt = this.scene.game.loop.delta / 1000;
      if (elapsed > duration + 2000) {
        this.scene.events.off('update', updateFn);
        return;
      }
      for (const c of coins) {
        if (!c.text.active) continue;
        c.vy += 200 * dt;
        c.text.y += c.vy * dt;
        c.text.x += c.vx * dt;
        c.text.angle += c.rotSpeed * dt;
        if (c.text.y > height + 50) {
          c.text.destroy();
        }
      }
    };
    this.scene.events.on('update', updateFn);
  }

  radialBurst(x: number, y: number, color: number, maxRadius: number = 200): void {
    const ring = this.scene.add.graphics();
    ring.setDepth(85);
    let radius = 0;
    const startTime = this.scene.time.now;

    const updateFn = () => {
      const elapsed = this.scene.time.now - startTime;
      const progress = elapsed / 500;
      if (progress >= 1) {
        ring.destroy();
        this.scene.events.off('update', updateFn);
        return;
      }
      radius = maxRadius * progress;
      ring.clear();
      ring.lineStyle(4 * (1 - progress), color, 1 - progress);
      ring.strokeCircle(x, y, radius);
      ring.lineStyle(2 * (1 - progress), color, (1 - progress) * 0.5);
      ring.strokeCircle(x, y, radius * 0.7);
    };
    this.scene.events.on('update', updateFn);
  }

  drawWinLine(
    points: { x: number; y: number }[],
    color: number,
    delay: number = 0,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(48);

    this.scene.time.delayedCall(delay, () => {
      let progress = 0;
      const totalLen = points.reduce((acc, p, i) => {
        if (i === 0) return 0;
        return acc + Phaser.Math.Distance.Between(points[i - 1].x, points[i - 1].y, p.x, p.y);
      }, 0);

      const updateFn = () => {
        progress += this.scene.game.loop.delta / 600;
        if (progress >= 1) {
          progress = 1;
          this.scene.events.off('update', updateFn);
        }
        graphics.clear();
        const drawLen = totalLen * progress;
        let remaining = drawLen;
        graphics.lineStyle(5, color, 0.9);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const segLen = Phaser.Math.Distance.Between(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
          if (remaining >= segLen) {
            graphics.lineTo(points[i].x, points[i].y);
            remaining -= segLen;
          } else {
            const t = remaining / segLen;
            const px = Phaser.Math.Linear(points[i - 1].x, points[i].x, t);
            const py = Phaser.Math.Linear(points[i - 1].y, points[i].y, t);
            graphics.lineTo(px, py);
            break;
          }
        }
        graphics.strokePath();

        graphics.lineStyle(2, 0xffffff, 0.5);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        remaining = drawLen;
        for (let i = 1; i < points.length; i++) {
          const segLen = Phaser.Math.Distance.Between(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
          if (remaining >= segLen) {
            graphics.lineTo(points[i].x, points[i].y);
            remaining -= segLen;
          } else {
            const t = remaining / segLen;
            const px = Phaser.Math.Linear(points[i - 1].x, points[i].x, t);
            const py = Phaser.Math.Linear(points[i - 1].y, points[i].y, t);
            graphics.lineTo(px, py);
            break;
          }
        }
        graphics.strokePath();
      };
      this.scene.events.on('update', updateFn);

      this.scene.time.delayedCall(2500, () => {
        this.scene.events.off('update', updateFn);
        this.scene.tweens.add({
          targets: graphics,
          alpha: 0,
          duration: 400,
          onComplete: () => graphics.destroy(),
        });
      });
    });

    return graphics;
  }

  glowPulse(
    target: Phaser.GameObjects.Text | Phaser.GameObjects.Container,
    color: number,
    duration: number = 800,
  ): void {
    const glow = this.scene.add.rectangle(
      target.x,
      target.y,
      (target as any).width || 100,
      (target as any).height || 100,
      color,
      0.3,
    );
    glow.setDepth(18);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0 },
      scale: { from: 0.8, to: 1.5 },
      duration,
      repeat: 2,
      onComplete: () => glow.destroy(),
    });
  }

  bigWinBanner(amount: number, multiplier: number): void {
    const { width, height } = this.scene.cameras.main;
    const isMega = multiplier >= 50;
    const isBig = multiplier >= 10;

    const fontSize = isMega ? '48px' : isBig ? '36px' : '28px';
    const label = isMega ? 'MEGA WIN!' : isBig ? 'BIG WIN!' : 'WIN!';
    const color = isMega ? COLORS.red : isBig ? COLORS.gold : COLORS.green;

    const banner = this.scene.add.container(width / 2, height / 2 - 50).setDepth(110);

    const bg = this.scene.add.rectangle(0, 0, 400, 80,
      Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.9);
    bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color);
    banner.add(bg);

    const text = this.scene.add.text(0, -10, `${label}`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize,
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    banner.add(text);

    const amountText = this.scene.add.text(0, 20, `+${amount.toLocaleString()} 🪙`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '22px',
      color: COLORS.gold,
    }).setOrigin(0.5);
    banner.add(amountText);

    banner.setScale(0);
    this.scene.tweens.add({
      targets: banner,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: isMega ? 2000 : isBig ? 1500 : 1000,
      onComplete: () => banner.destroy(),
    });

    if (isBig) {
      this.coinShower(isMega ? 40 : 20, 1500);
    }
    if (isMega) {
      this.radialBurst(width / 2, height / 2, Phaser.Display.Color.HexStringToColor(color).color, 300);
      this.scene.cameras.main.shake(400, 0.015);
      this.scene.cameras.main.flash(300, 255, 215, 0);
    }
  }

  // ==================== AURORA BLOBS ====================
  private createAuroraBlobs(): void {
    const { width, height } = this.scene.cameras.main;
    const blobConfigs = [
      { color: COLORS.cocktail, x: -100, y: -100, r: 150 },
      { color: COLORS.strawberry, x: width + 80, y: height + 80, r: 125 },
      { color: COLORS.purple, x: width / 2, y: height * 0.4, r: 100 },
    ];

    for (let i = 0; i < blobConfigs.length; i++) {
      const cfg = blobConfigs[i];
      const color = Phaser.Display.Color.HexStringToColor(cfg.color).color;
      const blob = this.scene.add.circle(cfg.x, cfg.y, cfg.r, color, 0.15);
      blob.setDepth(-8);
      blob.setBlendMode(Phaser.BlendModes.ADD);
      this.auroraBlobsData.push({
        gfx: blob,
        baseX: cfg.x,
        baseY: cfg.y,
        phase: i * 2.1,
      });
    }
    this.scene.events.on('update', this.updateAuroraBlobs, this);
  }

  private updateAuroraBlobs = (): void => {
    const t = this.scene.time.now * 0.001;
    for (const blob of this.auroraBlobsData) {
      const offsetX = Math.sin(t * 0.5 + blob.phase) * 80;
      const offsetY = Math.cos(t * 0.4 + blob.phase) * 60;
      blob.gfx.x = blob.baseX + offsetX;
      blob.gfx.y = blob.baseY + offsetY;
      const scale = 1 + Math.sin(t * 0.6 + blob.phase) * 0.3;
      blob.gfx.setScale(scale);
    }
  };

  // ==================== TWINKLING STARS ====================
  private createTwinklingStars(): void {
    const { width, height } = this.scene.cameras.main;
    const starCount = this.lowPerf ? 10 : 25;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const star = this.scene.add.text(x, y, '·', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${1 + Math.random() * 3}px`,
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(-7).setAlpha(0.3);
      this.starParticles.push({ text: star, phase: Math.random() * Math.PI * 2 });
    }
    this.scene.events.on('update', this.updateTwinklingStars, this);
  }

  private updateTwinklingStars = (): void => {
    const t = this.scene.time.now * 0.002;
    for (const s of this.starParticles) {
      s.text.setAlpha(0.15 + Math.abs(Math.sin(t + s.phase)) * 0.6);
    }
  };

  // ==================== FLOATING DECORATIONS ====================
  private createFloatingDecorations(): void {
    const { width, height } = this.scene.cameras.main;
    const emojis = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉', '🍹'];
    const count = this.lowPerf ? 3 : 6;
    for (let i = 0; i < count; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const text = this.scene.add.text(x, y, emoji, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
      }).setOrigin(0.5).setDepth(-6).setAlpha(0.12);
      this.decoFruits.push({
        text,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        rotSpeed: (Math.random() - 0.5) * 20,
      });
    }
    this.scene.events.on('update', this.updateDecoFruits, this);
  }

  private updateDecoFruits = (): void => {
    const { width, height } = this.scene.cameras.main;
    const dt = this.scene.game.loop.delta / 1000;
    for (const f of this.decoFruits) {
      f.text.x += f.vx * dt;
      f.text.y += f.vy * dt;
      f.text.angle += f.rotSpeed * dt;
      if (f.text.x < -30) f.text.x = width + 30;
      if (f.text.x > width + 30) f.text.x = -30;
      if (f.text.y < -30) f.text.y = height + 30;
      if (f.text.y > height + 30) f.text.y = -30;
    }
  };

  // ==================== PARTICLE BURST ====================
  particleBurst(
    x: number,
    y: number,
    count: number,
    opts?: {
      colors?: number[];
      speed?: number;
      size?: number;
    },
  ): void {
    const colors = opts?.colors ?? [
      Phaser.Display.Color.HexStringToColor(COLORS.gold).color,
      Phaser.Display.Color.HexStringToColor(COLORS.cocktail).color,
      Phaser.Display.Color.HexStringToColor(COLORS.red).color,
      Phaser.Display.Color.HexStringToColor(COLORS.green).color,
      Phaser.Display.Color.HexStringToColor(COLORS.purple).color,
      0xffffff,
    ];
    const speed = opts?.speed ?? 8;
    const size = opts?.size ?? 6;
    const actualCount = this.lowPerf ? Math.min(count, 12) : count;

    for (let i = 0; i < actualCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = Math.random() * speed + 2;
      this.burstParticles.push({
        x,
        y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - 2,
        g: 0.3,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        size: Math.random() * size + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < 0.3 ? 'star' : 'circle',
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
      });
    }

    if (!this.burstGraphics) {
      this.burstGraphics = this.scene.add.graphics();
      this.burstGraphics.setDepth(95);
      this.scene.events.on('update', this.updateBurstParticles, this);
    }
  }

  private updateBurstParticles = (): void => {
    if (!this.burstGraphics || this.burstParticles.length === 0) return;
    this.burstGraphics.clear();
    const useShadow = !this.lowPerf;

    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.99;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.burstParticles.splice(i, 1);
        continue;
      }
      const alpha = p.life;
      const r = p.size * p.life;
      this.burstGraphics.fillStyle(p.color, alpha);

      if (p.shape === 'star') {
        this.drawStar(this.burstGraphics, p.x, p.y, r, p.rot, p.color, useShadow);
      } else {
        this.burstGraphics.fillCircle(p.x, p.y, r);
      }
    }

    if (this.burstParticles.length === 0) {
      this.burstGraphics.clear();
    }
  };

  private drawStar(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    rot: number,
    color: number,
    shadow: boolean,
  ): void {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2 + rot;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
      const a2 = a + Math.PI / 5;
      const px2 = x + Math.cos(a2) * r * 0.4;
      const py2 = y + Math.sin(a2) * r * 0.4;
      gfx.lineTo(px2, py2);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  // ==================== FLASH SCREEN ====================
  flashScreen(color: 'gold' | 'red' | 'green' | 'purple'): void {
    const { width, height } = this.scene.cameras.main;
    const colorMap: Record<string, [number, number]> = {
      gold: [Phaser.Display.Color.HexStringToColor(COLORS.gold).color, 0.4],
      red: [Phaser.Display.Color.HexStringToColor(COLORS.red).color, 0.5],
      green: [Phaser.Display.Color.HexStringToColor(COLORS.green).color, 0.4],
      purple: [Phaser.Display.Color.HexStringToColor(COLORS.purple).color, 0.5],
    };
    const [c, alpha] = colorMap[color] ?? colorMap.gold;

    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, c, alpha);
    flash.setDepth(94);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  // ==================== LIGHTNING ====================
  lightning(): void {
    const { width, height } = this.scene.cameras.main;
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const x = Math.random() * width;
        const bolt = this.scene.add.graphics();
        bolt.setDepth(93);
        bolt.setBlendMode(Phaser.BlendModes.ADD);
        const segments = 8;
        const segHeight = height / segments;
        bolt.lineStyle(2 + Math.random() * 4, goldColor, 0.8);
        bolt.beginPath();
        bolt.moveTo(x, 0);
        let curX = x;
        for (let s = 1; s <= segments; s++) {
          curX += (Math.random() - 0.5) * 30;
          bolt.lineTo(curX, s * segHeight);
        }
        bolt.strokePath();

        this.scene.tweens.add({
          targets: bolt,
          alpha: { from: 1, to: 0 },
          duration: 300,
          onComplete: () => bolt.destroy(),
        });
      });
    }
  }

  // ==================== JACKPOT ZOOM ====================
  jackpotZoom(): void {
    const { width, height } = this.scene.cameras.main;
    const container = this.scene.add.container(width / 2, height / 2).setDepth(96);

    const text = this.scene.add.text(0, 0, '💎 JACKPOT! 💎', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '64px',
      color: COLORS.gold,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    container.add(text);

    const glow = this.scene.add.rectangle(0, 0, width, 120, 0x000000, 0.5);
    container.addAt(glow, 0);

    container.setScale(0).setAngle(-180).setAlpha(0);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      angle: 0,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1500,
      onComplete: () => container.destroy(),
    });

    // Gradient shimmer effect
    this.scene.tweens.add({
      targets: text,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
    });
  }

  // ==================== COMBO MEGA ====================
  comboMega(text: string): void {
    const { width, height } = this.scene.cameras.main;
    const combo = this.scene.add.text(width / 2, height * 0.3, text, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '48px',
      color: COLORS.gold,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(55).setScale(0.3).setAlpha(0);

    this.scene.tweens.add({
      targets: combo,
      scale: 1.4,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => combo.destroy(),
    });
  }

  // ==================== ANIMATE BALANCE ====================
  animateBalance(textObj: Phaser.GameObjects.Text, from: number, to: number): void {
    const diff = to - from;
    const steps = 20;
    let step = 0;
    textObj.setScale(1);

    this.scene.tweens.add({
      targets: textObj,
      scale: 1.15,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    this.scene.time.addEvent({
      delay: 30,
      repeat: steps - 1,
      callback: () => {
        step++;
        const cur = Math.round(from + diff * (step / steps));
        textObj.setText(`🪙 ${cur}`);
        if (step >= steps) {
          textObj.setText(`🪙 ${to}`);
        }
      },
    });
  }

  // ==================== CONFETTI ====================
  confetti(count: number): void {
    const { width, height } = this.scene.cameras.main;
    const emojis = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉', '🍹', '🍓', '🪙', '⭐', '🎉'];
    const actualCount = this.lowPerf ? Math.min(count, 15) : count;

    for (let i = 0; i < actualCount; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        const x = Math.random() * width;
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const piece = this.scene.add.text(x, -30, emoji, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
        }).setOrigin(0.5).setDepth(90);

        this.scene.tweens.add({
          targets: piece,
          y: height + 50,
          angle: 720,
          alpha: 0,
          duration: 1800 + Math.random() * 400,
          ease: 'Linear',
          onComplete: () => piece.destroy(),
        });
      });
    }
  }

  // ==================== FLOATING SCORE ====================
  floatingScore(x: number, y: number, text: string, color: string = COLORS.gold): void {
    const score = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(60);

    this.scene.tweens.add({
      targets: score,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => score.destroy(),
    });
  }

  // ==================== VIGNETTE MODES ====================
  setVignette(mode: 'normal' | 'fever' | 'jackpot'): void {
    if (this.vignetteMode === mode) return;
    this.vignetteMode = mode;

    if (this.vignettePulseTween) {
      this.vignettePulseTween.stop();
      this.vignettePulseTween = null;
    }

    if (!this.vignetteGraphics) return;
    const { width, height } = this.scene.cameras.main;

    if (mode === 'normal') {
      this.vignetteGraphics.clear();
      this.vignetteGraphics.fillStyle(0x000000, 0.3);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.7);
      this.vignetteGraphics.fillStyle(0x000000, 0);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.3);
    } else if (mode === 'fever') {
      this.vignetteGraphics.clear();
      this.vignetteGraphics.fillStyle(0xff3366, 0.15);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.8);
      this.vignetteGraphics.fillStyle(0x000000, 0);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.3);
    } else if (mode === 'jackpot') {
      this.vignetteGraphics.clear();
      const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
      this.vignetteGraphics.fillStyle(goldColor, 0.2);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.8);
      this.vignetteGraphics.fillStyle(0x000000, 0);
      this.vignetteGraphics.fillCircle(width / 2, height / 2, width * 0.3);

      this.vignettePulseTween = this.scene.tweens.add({
        targets: this.vignetteGraphics,
        alpha: { from: 0.6, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ==================== SALDO PULSE ====================
  saldoPulse(target: Phaser.GameObjects.Text): void {
    this.scene.tweens.add({
      targets: target,
      scale: 1.15,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  // ==================== SHAKE REEL ====================
  shakeReel(container: Phaser.GameObjects.Container): void {
    const origX = container.x;
    this.scene.tweens.add({
      targets: container,
      x: origX - 4,
      duration: 75,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => { container.x = origX; },
    });
  }

  // ==================== NEAR MISS PULSE ====================
  nearMissPulse(text: Phaser.GameObjects.Text): void {
    this.scene.tweens.add({
      targets: text,
      scale: 1.3,
      alpha: { from: 1, to: 0.4 },
      duration: 250,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => { text.setScale(1).setAlpha(1); },
    });
  }

  // ==================== REEL GLOW TRAIL ====================
  reelGlowTrail(container: Phaser.GameObjects.Container): Phaser.GameObjects.Rectangle {
    const glow = this.scene.add.rectangle(
      container.x + 70,
      container.y + 180,
      140,
      360,
      Phaser.Display.Color.HexStringToColor(COLORS.gold).color,
      0.08,
    );
    glow.setDepth(11);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return glow;
  }

  jackpotLightRays(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;
    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;
    const rayCount = 12;
    const rays: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const ray = this.scene.add.graphics();
      ray.setDepth(96);
      ray.setBlendMode(Phaser.BlendModes.ADD);
      rays.push(ray);

      const x2 = cx + Math.cos(angle) * width;
      const y2 = cy + Math.sin(angle) * width;
      const px = -Math.sin(angle);
      const py = Math.cos(angle);
      const halfWidth = 40;

      ray.fillStyle(goldColor, 0.15);
      ray.beginPath();
      ray.moveTo(cx + px * halfWidth, cy + py * halfWidth);
      ray.lineTo(x2 + px * halfWidth * 3, y2 + py * halfWidth * 3);
      ray.lineTo(x2 - px * halfWidth * 3, y2 - py * halfWidth * 3);
      ray.lineTo(cx - px * halfWidth, cy - py * halfWidth);
      ray.closePath();
      ray.fillPath();

      this.scene.tweens.add({
        targets: ray,
        alpha: { from: 0.3, to: 0 },
        duration: 800 + i * 50,
        ease: 'Cubic.easeOut',
        onComplete: () => ray.destroy(),
      });
    }
  }

  // ==================== TOAST NOTIFICATION ====================
  showToast(message: string, color: string = COLORS.red, duration: number = 2000): void {
    const { width, height } = this.scene.cameras.main;
    const container = this.scene.add.container(width / 2, -60).setDepth(130);

    const bg = this.scene.add.rectangle(0, 0, 360, 50,
      Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.95);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    container.add(bg);

    const text = this.scene.add.text(0, 0, message, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '16px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(text);

    this.scene.tweens.add({
      targets: container,
      y: 70,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: duration - 600,
      onComplete: () => container.destroy(),
    });
  }

  // ==================== SHAKE BUTTON ====================
  shakeButton(target: Phaser.GameObjects.Text): void {
    const origX = target.x;
    this.scene.tweens.add({
      targets: target,
      x: origX - 8,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => { target.x = origX; },
    });
  }

  destroy(): void {
    this.scene.events.off('update', this.updateLightRays, this);
    this.scene.events.off('update', this.updateAmbientParticles, this);
    this.scene.events.off('update', this.updateAuroraBlobs, this);
    this.scene.events.off('update', this.updateTwinklingStars, this);
    this.scene.events.off('update', this.updateDecoFruits, this);
    this.scene.events.off('update', this.updateBurstParticles, this);
    if (this.ambientTimer) this.ambientTimer.remove();
    for (const p of this.ambientParticles) {
      if (p.text) p.text.destroy();
    }
    this.ambientParticles = [];
    for (const b of this.auroraBlobsData) {
      if (b.gfx) b.gfx.destroy();
    }
    this.auroraBlobsData = [];
    for (const s of this.starParticles) {
      if (s.text) s.text.destroy();
    }
    this.starParticles = [];
    for (const f of this.decoFruits) {
      if (f.text) f.text.destroy();
    }
    this.decoFruits = [];
    this.burstParticles = [];
    if (this.burstGraphics) this.burstGraphics.destroy();
    if (this.vignettePulseTween) this.vignettePulseTween.stop();
    if (this.bgGraphics) this.bgGraphics.destroy();
    if (this.lightRayGraphics) this.lightRayGraphics.destroy();
    if (this.vignetteGraphics) this.vignetteGraphics.destroy();
  }
}
