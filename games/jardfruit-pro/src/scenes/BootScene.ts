import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS } from '@config/balance';
import { SaveManager } from '@store/SaveManager';
import { DailyLogin } from '@systems/DailyLogin';
import { ChallengeChecker } from '@systems/ChallengeChecker';
import { useGameStore } from '@store/gameStore';
import { AudioEngine } from '@audio/AudioEngine';
import { PerformanceManager } from '@systems/PerformanceManager';

export class BootScene extends Phaser.Scene {
  private audioEngine: AudioEngine;
  private perfManager: PerformanceManager = new PerformanceManager();

  constructor() {
    super({ key: SCENES.BOOT });
    this.audioEngine = new AudioEngine();
  }

  preload(): void {
    this.load.setBaseURL(window.location.origin);
  }

  create(): void {
    const state = SaveManager.load();
    const { state: stateWithLogin, reward, streak } = DailyLogin.check(state);
    const challenges = ChallengeChecker.checkDaily(stateWithLogin);
    const newState = { ...stateWithLogin, challenges, challengesDate: new Date().toDateString() };
    useGameStore.getState().set(newState);
    SaveManager.save(newState);

    this.perfManager.autoDetect();
    if (this.perfManager.isMobileDevice()) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);

    if (reward > 0) {
      this.showDailyLoginPopup(reward, streak);
      this.time.delayedCall(3000, () => {
        this.scene.start(SCENES.MENU);
      });
    } else {
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.MENU);
      });
    }
  }

  private showDailyLoginPopup(reward: number, streak: number): void {
    const { width } = this.cameras.main;
    this.audioEngine.init();
    this.audioEngine.sfx('coin');

    const container = this.add.container(width / 2, -100).setDepth(200);

    const bg = this.add.rectangle(0, 0, 360, 120,
      Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.95);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.gold).color);
    container.add(bg);

    const title = this.add.text(0, -35, '🔥 RECOMPENSA DIARIA', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '18px', color: COLORS.gold,
    }).setOrigin(0.5);
    container.add(title);

    const dayText = this.add.text(0, -10, `Día ${streak} de racha`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.text,
    }).setOrigin(0.5);
    container.add(dayText);

    const rewardText = this.add.text(0, 20, `+${reward} 🪙`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '28px', color: COLORS.green,
    }).setOrigin(0.5);
    container.add(rewardText);

    for (let i = 0; i < 7; i++) {
      const dx = -120 + i * 40;
      const claimed = i < streak % 7 || (streak >= 7 && i < 7);
      const dy = 45;
      const dot = this.add.text(dx, dy, claimed ? '✅' : '⬜', {
        fontSize: '16px',
      }).setOrigin(0.5);
      container.add(dot);
    }

    this.tweens.add({
      targets: container,
      y: 120,
      duration: 600,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1800,
      onComplete: () => container.destroy(),
    });
  }
}
