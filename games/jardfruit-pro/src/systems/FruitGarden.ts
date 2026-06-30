import Phaser from 'phaser';
import { useGameStore } from '@store/gameStore';
import { AudioEngine } from '@audio/AudioEngine';

interface FloatingFruit {
  text: Phaser.GameObjects.Text;
  vx: number;
  vy: number;
  value: number;
  golden: boolean;
  bornAt: number;
  expired: boolean;
}

const FRUIT_EMOJIS = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉'];
const SPAWN_INTERVAL = 3000;
const FRUIT_LIFETIME = 3000;
const WARNING_AT = 2000;
const GOLDEN_CHANCE = 0.05;
const GOLDEN_VALUE = 50;

export class FruitGarden {
  private scene: Phaser.Scene;
  private audioEngine: AudioEngine;
  private fruits: FloatingFruit[] = [];
  private lastSpawn: number = 0;
  private active: boolean = false;
  private rafId: number | null = null;
  private lastFrame: number = 0;

  constructor(scene: Phaser.Scene, audioEngine: AudioEngine) {
    this.scene = scene;
    this.audioEngine = audioEngine;
  }

  start(): void {
    this.active = true;
    this.lastSpawn = this.scene.time.now;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop(): void {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clearAll();
  }

  private loop = (): void => {
    if (!this.active) return;
    if (document.hidden) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const now = performance.now();
    const dt = Math.min(now - this.lastFrame, 50);
    this.lastFrame = now;

    const phaserNow = this.scene.time.now;
    const s = useGameStore.getState();
    const canSpawn = !s.girando && !s.enBono && !s.enGamble;

    const maxFruits = s.upgrades.fruitSprinkler ? 5 : 3;
    if (canSpawn && phaserNow - this.lastSpawn >= SPAWN_INTERVAL && this.fruits.length < maxFruits) {
      this.spawnFruit(!!s.upgrades.goldenTouch, !!s.upgrades.fruitMagnet);
      this.lastSpawn = phaserNow;
    }

    this.updateFruits(dt, !!s.upgrades.fruitMagnet, !!s.upgrades.autoCatcher);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private spawnFruit(goldenTouch: boolean, _fruitMagnet: boolean): void {
    const { width, height } = this.scene.cameras.main;
    const golden = Math.random() < GOLDEN_CHANCE;
    const emoji = golden ? '⭐' : FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
    const baseValue = golden ? GOLDEN_VALUE : 1 + Math.floor(Math.random() * 5);
    const value = goldenTouch ? baseValue * 2 : baseValue;

    const x = 100 + Math.random() * (width - 200);
    const y = 150 + Math.random() * (height - 250);

    const text = this.scene.add.text(x, y, emoji, {
      fontFamily: 'Arial, sans-serif',
      fontSize: golden ? '36px' : '28px',
    }).setOrigin(0.5).setDepth(60).setInteractive({ useHandCursor: true });

    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 40;
    const fruit: FloatingFruit = {
      text,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      value,
      golden,
      bornAt: this.scene.time.now,
      expired: false,
    };

    text.on('pointerdown', () => this.catchFruit(fruit));
    this.fruits.push(fruit);
  }

  private updateFruits(dt: number, fruitMagnet: boolean, autoCatcher: boolean): void {
    const { width, height } = this.scene.cameras.main;
    const phaserNow = this.scene.time.now;
    const secs = dt / 1000;
    const centerX = width / 2;
    const centerY = height / 2;

    for (const fruit of this.fruits) {
      if (fruit.expired) continue;

      if (fruitMagnet) {
        const dx = centerX - fruit.text.x;
        const dy = centerY - fruit.text.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          fruit.vx += (dx / dist) * 30 * secs;
          fruit.vy += (dy / dist) * 30 * secs;
        }
      }

      fruit.text.x += fruit.vx * secs;
      fruit.text.y += fruit.vy * secs;

      if (fruit.text.x < 30 || fruit.text.x > width - 30) {
        fruit.vx *= -1;
        fruit.text.x = Phaser.Math.Clamp(fruit.text.x, 30, width - 30);
      }
      if (fruit.text.y < 120 || fruit.text.y > height - 100) {
        fruit.vy *= -1;
        fruit.text.y = Phaser.Math.Clamp(fruit.text.y, 120, height - 100);
      }

      const age = phaserNow - fruit.bornAt;
      if (age >= WARNING_AT) {
        fruit.text.setAlpha(0.5 + Math.sin(age * 0.02) * 0.3);
      }

      if (autoCatcher && age > 500) {
        this.catchFruit(fruit);
      }

      if (age >= FRUIT_LIFETIME) {
        this.expireFruit(fruit);
      }
    }

    this.fruits = this.fruits.filter((f) => !f.expired);
  }

  private catchFruit(fruit: FloatingFruit): void {
    if (fruit.expired) return;
    fruit.expired = true;

    const s = useGameStore.getState();
    useGameStore.getState().set({
      saldo: s.saldo + fruit.value,
      stats: {
        ...s.stats,
        fruitsCaught: s.stats.fruitsCaught + 1,
        totalWon: s.stats.totalWon + fruit.value,
      },
    });

    this.audioEngine.sfx('tapFruit');
    this.audioEngine.vibrate(20);

    this.showFloatingScore(fruit.text.x, fruit.text.y, fruit.value, fruit.golden);

    this.scene.tweens.add({
      targets: fruit.text,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => fruit.text.destroy(),
    });
  }

  private expireFruit(fruit: FloatingFruit): void {
    fruit.expired = true;
    this.scene.tweens.add({
      targets: fruit.text,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => fruit.text.destroy(),
    });
  }

  private showFloatingScore(x: number, y: number, value: number, golden: boolean): void {
    const score = this.scene.add.text(x, y, `+${value} 🪙`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '20px',
      color: golden ? '#ffd700' : '#00ff88',
    }).setOrigin(0.5).setDepth(70);

    this.scene.tweens.add({
      targets: score,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => score.destroy(),
    });
  }

  private clearAll(): void {
    for (const fruit of this.fruits) {
      if (fruit.text) fruit.text.destroy();
    }
    this.fruits = [];
  }
}
