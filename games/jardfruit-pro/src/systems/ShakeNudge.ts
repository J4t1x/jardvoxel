import Phaser from 'phaser';
import { AudioEngine } from '@audio/AudioEngine';
import { ReelEngine } from '@systems/ReelEngine';
import { REELS_COUNT } from '@config/symbols';

const REQUIRED_TAPS = 5;
const WINDOW_MS = 3000;

export class ShakeNudge {
  private scene: Phaser.Scene;
  private audioEngine: AudioEngine;
  private reelEngine: ReelEngine;
  private active: boolean = false;
  private tapCount: number = 0;
  private windowTimer: Phaser.Time.TimerEvent | null = null;
  private toast: Phaser.GameObjects.Text | null = null;
  private counterText: Phaser.GameObjects.Text | null = null;
  private used: boolean = false;
  private onNudgeComplete: (() => void) | null = null;
  private onNudgeRender: ((reelIdx: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    audioEngine: AudioEngine,
    reelEngine: ReelEngine,
  ) {
    this.scene = scene;
    this.audioEngine = audioEngine;
    this.reelEngine = reelEngine;
  }

  canActivate(nearMiss: boolean): boolean {
    return nearMiss && !this.used && !this.active;
  }

  activate(onComplete: () => void, onNudgeRender?: (reelIdx: number) => void): void {
    if (this.used || this.active) return;
    this.active = true;
    this.tapCount = 0;
    this.onNudgeComplete = onComplete;
    this.onNudgeRender = onNudgeRender ?? null;

    const { width, height } = this.scene.cameras.main;
    this.toast = this.scene.add.text(width / 2, height - 120, '¡Casi! Toca 5x para nudge', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '18px',
      color: '#ffeb3b',
      backgroundColor: '#000000aa',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(85);

    this.counterText = this.scene.add.text(width / 2, height - 80, `0 / ${REQUIRED_TAPS}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5).setDepth(85);

    this.scene.tweens.add({
      targets: this.toast,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.windowTimer = this.scene.time.delayedCall(WINDOW_MS, () => {
      this.deactivate(false);
    });
  }

  onTap(x: number, y: number): boolean {
    if (!this.active) return false;

    if (this.toast) {
      const toastBounds = this.toast.getBounds();
      if (toastBounds.contains(x, y)) return false;
    }

    this.tapCount++;
    this.audioEngine.sfx('tapFruit');
    this.audioEngine.vibrate(10);

    if (this.counterText) {
      this.counterText.setText(`${this.tapCount} / ${REQUIRED_TAPS}`);
    }

    if (this.tapCount >= REQUIRED_TAPS) {
      this.deactivate(true);
      return true;
    }

    return false;
  }

  private deactivate(success: boolean): void {
    this.active = false;

    if (this.windowTimer) {
      this.windowTimer.remove();
      this.windowTimer = null;
    }

    if (this.toast) {
      this.scene.tweens.add({
        targets: [this.toast, this.counterText].filter(Boolean),
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.toast) this.toast.destroy();
          if (this.counterText) this.counterText.destroy();
          this.toast = null;
          this.counterText = null;
        },
      });
    }

    if (success) {
      this.executeNudge();
    } else if (this.onNudgeComplete) {
      this.onNudgeComplete();
      this.onNudgeComplete = null;
    }
  }

  private executeNudge(): void {
    this.used = true;
    const reelIdx = Math.floor(Math.random() * REELS_COUNT);
    this.reelEngine.nudgeReel(reelIdx);
    if (this.onNudgeRender) this.onNudgeRender(reelIdx);

    this.audioEngine.sfx('nudge');
    this.audioEngine.vibrate([30, 20, 30]);

    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      width / 2, height / 2, width, height,
      Phaser.Display.Color.HexStringToColor('#00ff88').color, 0.3,
    );
    flash.setDepth(90);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    if (this.onNudgeComplete) {
      this.onNudgeComplete();
      this.onNudgeComplete = null;
    }
  }

  reset(): void {
    this.used = false;
    this.active = false;
    this.tapCount = 0;
    if (this.windowTimer) {
      this.windowTimer.remove();
      this.windowTimer = null;
    }
    if (this.toast) {
      this.toast.destroy();
      this.toast = null;
    }
    if (this.counterText) {
      this.counterText.destroy();
      this.counterText = null;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.reset();
  }
}
