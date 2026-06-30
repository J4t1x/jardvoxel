import Phaser from 'phaser';

const MEGA_THRESHOLDS = [10, 20, 50];
const DECAY_DELAY = 500;

export class TapCombo {
  private scene: Phaser.Scene;
  private comboText: Phaser.GameObjects.Text | null = null;
  private lastTapTime: number = 0;
  private decayTimer: Phaser.Time.TimerEvent | null = null;
  private megaShown: Set<number> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  onTap(x: number, y: number, combo: number): void {
    this.lastTapTime = this.scene.time.now;

    if (this.comboText) this.comboText.destroy();

    this.comboText = this.scene.add.text(x, y - 30, `🫳 x${combo}`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '20px',
      color: '#ffeb3b',
    }).setOrigin(0.5).setDepth(75);

    this.scene.tweens.add({
      targets: this.comboText,
      y: y - 60,
      alpha: 0.7,
      duration: 400,
    });

    this.spawnParticles(x, y, Math.min(combo, 15));

    for (const threshold of MEGA_THRESHOLDS) {
      if (combo >= threshold && !this.megaShown.has(threshold)) {
        this.megaShown.add(threshold);
        this.showMegaCombo(threshold);
      }
    }

    if (this.decayTimer) this.decayTimer.remove();
    this.decayTimer = this.scene.time.delayedCall(DECAY_DELAY, () => {
      if (this.comboText) {
        this.scene.tweens.add({
          targets: this.comboText,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            if (this.comboText) {
              this.comboText.destroy();
              this.comboText = null;
            }
          },
        });
      }
    });
  }

  private spawnParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 20 + Math.random() * 20;
      const particle = this.scene.add.text(
        x + Math.cos(angle) * 10,
        y + Math.sin(angle) * 10,
        '✨',
        { fontFamily: 'Arial, sans-serif', fontSize: '14px' },
      ).setOrigin(0.5).setDepth(74);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showMegaCombo(threshold: number): void {
    const { width, height } = this.scene.cameras.main;
    const mega = this.scene.add.text(width / 2, height / 2 - 50, `MEGA COMBO x${threshold}!`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '32px',
      color: '#ff3366',
      stroke: '#ffd700',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(80).setScale(0);

    this.scene.tweens.add({
      targets: mega,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 500,
      onComplete: () => mega.destroy(),
    });
  }

  reset(): void {
    this.megaShown.clear();
    if (this.comboText) {
      this.comboText.destroy();
      this.comboText = null;
    }
    if (this.decayTimer) {
      this.decayTimer.remove();
      this.decayTimer = null;
    }
  }

  destroy(): void {
    this.reset();
  }
}
