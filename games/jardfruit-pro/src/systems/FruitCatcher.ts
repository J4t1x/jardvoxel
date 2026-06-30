import Phaser from 'phaser';
import { useGameStore } from '@store/gameStore';
import { AudioEngine } from '@audio/AudioEngine';

interface FallingFruit {
  text: Phaser.GameObjects.Text;
  vy: number;
  value: number;
  caught: boolean;
  timeoutMs: number;
  bornAt: number;
}

const FRUIT_EMOJIS = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉'];
const GRAVITY = 0.3;
const FRUIT_COUNT = 3;
const PER_FRUIT_TIMEOUT = 2000;
const PERFECT_BONUS = 20;

export class FruitCatcher {
  private scene: Phaser.Scene;
  private audioEngine: AudioEngine;
  private fruits: FallingFruit[] = [];
  private active: boolean = false;
  private rafId: number | null = null;
  private lastFrame: number = 0;
  private caughtCount: number = 0;
  private onComplete: (() => void) | null = null;

  constructor(scene: Phaser.Scene, audioEngine: AudioEngine) {
    this.scene = scene;
    this.audioEngine = audioEngine;
  }

  start(onComplete: () => void): void {
    this.active = true;
    this.caughtCount = 0;
    this.onComplete = onComplete;
    this.lastFrame = performance.now();
    this.spawnFruits();
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

  private spawnFruits(): void {
    const { width } = this.scene.cameras.main;
    const catchMaster = !!useGameStore.getState().upgrades.catchMaster;

    for (let i = 0; i < FRUIT_COUNT; i++) {
      const emoji = FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
      const x = 100 + (width - 200) * (i / (FRUIT_COUNT - 1));
      const baseValue = 2 + Math.floor(Math.random() * 9);
      const value = catchMaster ? baseValue * 3 : baseValue;

      const text = this.scene.add.text(x, -30, emoji, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
      }).setOrigin(0.5).setDepth(80).setInteractive({ useHandCursor: true });

      const fruit: FallingFruit = {
        text,
        vy: 0,
        value,
        caught: false,
        timeoutMs: PER_FRUIT_TIMEOUT,
        bornAt: this.scene.time.now,
      };

      text.on('pointerdown', () => this.catchFruit(fruit));
      this.fruits.push(fruit);

      this.scene.time.delayedCall(i * 200, () => {
        if (this.active && !fruit.caught) {
          fruit.bornAt = this.scene.time.now;
        }
      });
    }
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
    const secs = dt / 1000;
    const phaserNow = this.scene.time.now;
    const { height } = this.scene.cameras.main;

    for (const fruit of this.fruits) {
      if (fruit.caught) continue;

      fruit.vy += GRAVITY * (secs * 60);
      fruit.text.y += fruit.vy * secs;

      if (fruit.text.y > height + 40) {
        fruit.caught = true;
        fruit.text.destroy();
      }

      const age = phaserNow - fruit.bornAt;
      if (age >= fruit.timeoutMs) {
        fruit.caught = true;
        fruit.text.destroy();
      }
    }

    const allDone = this.fruits.every((f) => f.caught);
    if (allDone) {
      this.finish();
      return;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private catchFruit(fruit: FallingFruit): void {
    if (fruit.caught) return;
    fruit.caught = true;
    this.caughtCount++;

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

    this.showFloatingScore(fruit.text.x, fruit.text.y, fruit.value);

    this.scene.tweens.add({
      targets: fruit.text,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => fruit.text.destroy(),
    });
  }

  private showFloatingScore(x: number, y: number, value: number): void {
    const score = this.scene.add.text(x, y, `+${value} 🪙`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '20px',
      color: '#00ff88',
    }).setOrigin(0.5).setDepth(90);

    this.scene.tweens.add({
      targets: score,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => score.destroy(),
    });
  }

  private finish(): void {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.caughtCount === FRUIT_COUNT) {
      const s = useGameStore.getState();
      useGameStore.getState().set({
        saldo: s.saldo + PERFECT_BONUS,
        stats: {
          ...s.stats,
          totalWon: s.stats.totalWon + PERFECT_BONUS,
        },
      });

      this.audioEngine.sfx('coin');
      this.audioEngine.vibrate([30, 20, 30]);

      const { width, height } = this.scene.cameras.main;
      const toast = this.scene.add.text(width / 2, height / 2, `PERFECT CATCH! +${PERFECT_BONUS} 🪙`, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#ffd700',
      }).setOrigin(0.5).setDepth(100);

      this.scene.tweens.add({
        targets: toast,
        y: height / 2 - 40,
        alpha: 0,
        duration: 1500,
        onComplete: () => toast.destroy(),
      });
    }

    this.clearAll();
    if (this.onComplete) this.onComplete();
  }

  private clearAll(): void {
    for (const fruit of this.fruits) {
      if (fruit.text && !fruit.caught) fruit.text.destroy();
    }
    this.fruits = [];
  }
}
