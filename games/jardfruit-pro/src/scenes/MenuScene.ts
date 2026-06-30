import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS } from '@config/balance';
import { useGameStore } from '@store/gameStore';
import { AudioEngine } from '@audio/AudioEngine';
import { Economy } from '@systems/Economy';
import { SaveManager } from '@store/SaveManager';
import { EffectsManager } from '@systems/EffectsManager';

export class MenuScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private effectsManager: EffectsManager | null = null;

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    const state = useGameStore.getState();
    const { width, height } = this.cameras.main;

    this.effectsManager = new EffectsManager(this);
    this.effectsManager.createAnimatedBackground();

    const goldColor = Phaser.Display.Color.HexStringToColor(COLORS.gold).color;

    const titleGlow = this.add.rectangle(width / 2, height / 2 - 120, 500, 100, goldColor, 0.08);
    titleGlow.setDepth(-1);
    titleGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0.05, to: 0.15 },
      scale: { from: 0.9, to: 1.1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const title = this.add.text(width / 2, height / 2 - 120, 'JardFruit\nCocktail', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '64px',
      color: COLORS.gold,
      align: 'center',
      stroke: COLORS.red,
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: COLORS.gold, blur: 20, fill: true, stroke: true },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: height / 2 - 110,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.tweens.add({
      targets: title,
      scaleX: { from: 0.98, to: 1.02 },
      scaleY: { from: 0.98, to: 1.02 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(width / 2, height / 2 - 30, 'Professional Edition', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    const startBtnGlow = this.add.rectangle(width / 2, height / 2 + 60, 220, 70, goldColor, 0.06);
    startBtnGlow.setDepth(0);
    startBtnGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: startBtnGlow,
      alpha: { from: 0.04, to: 0.15 },
      scale: { from: 0.95, to: 1.05 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const startBtn = this.add.text(width / 2, height / 2 + 60, 'JUGAR', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: COLORS.surface,
      padding: { x: 40, y: 16 },
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setStyle({ color: COLORS.gold, backgroundColor: COLORS.reel });
      startBtn.setScale(1.06);
    });
    startBtn.on('pointerout', () => {
      startBtn.setStyle({ color: '#ffffff', backgroundColor: COLORS.surface });
      startBtn.setScale(1);
    });
    startBtn.on('pointerdown', () => {
      this.audioEngine.init();
      this.audioEngine.startMusic(this.audioEngine.pickLoungeTrack());
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start(SCENES.SLOT);
      });
    });

    this.add.text(width / 2, height / 2 + 140, `Saldo: ${state.saldo} coins`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.gold,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 170, `Nivel ${state.nivel} · Prestigio ${state.prestigio}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 40, 'Toca JUGAR para comenzar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    if (state.prestigio > 0) {
      this.add.text(width / 2, height / 2 + 200,
        `⭐ Prestigio ${state.prestigio} · Mult x${state.prestigeMult.toFixed(1)}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: COLORS.purple,
        }).setOrigin(0.5);
    }

    if (state.loginStreak > 0) {
      this.add.text(width / 2, height / 2 + 230,
        `🔥 Racha: ${state.loginStreak} día${state.loginStreak > 1 ? 's' : ''}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: COLORS.gold,
        }).setOrigin(0.5);
    }

    if (Economy.canPrestige(state)) {
      const prestigeBtn = this.add.text(width / 2, height / 2 + 240, '⭐ PRESTIGIO ⭐', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: COLORS.text,
        backgroundColor: COLORS.purple,
        padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      prestigeBtn.on('pointerover', () => prestigeBtn.setStyle({ color: COLORS.gold }));
      prestigeBtn.on('pointerout', () => prestigeBtn.setStyle({ color: COLORS.text }));
      prestigeBtn.on('pointerdown', () => {
        const cur = useGameStore.getState();
        const updated = Economy.doPrestige(cur);
        useGameStore.getState().set(updated);
        SaveManager.save(updated);
        this.audioEngine.init();
        this.audioEngine.sfx('prestige');
        this.audioEngine.vibrate([50, 30, 50, 30, 50, 30, 100]);

        this.cameras.main.flash(500, 124, 58, 237);

        const banner = this.add.text(width / 2, height / 2, '', {
          fontFamily: 'Arial Black, sans-serif',
          fontSize: '32px',
          color: COLORS.purple,
          stroke: COLORS.gold,
          strokeThickness: 4,
        }).setOrigin(0.5).setDepth(100);
        banner.setText(`⭐ PRESTIGIO ${updated.prestigio}! x${updated.prestigeMult.toFixed(1)} ⭐`);
        banner.setScale(0);
        this.tweens.add({
          targets: banner,
          scale: 1,
          duration: 500,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.time.delayedCall(2000, () => {
              this.tweens.add({
                targets: banner,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  banner.destroy();
                  this.scene.restart();
                },
              });
            });
          },
        });

        const confettiEmojis = ['⭐', '💎', '🪙', '🎉', '🎊'];
        for (let i = 0; i < 30; i++) {
          const cx = Math.random() * width;
          const emoji = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
          const conf = this.add.text(cx, -20, emoji, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
          }).setOrigin(0.5).setDepth(90);
          this.tweens.add({
            targets: conf,
            y: height + 40,
            x: cx + (Math.random() - 0.5) * 200,
            angle: Math.random() * 360,
            duration: 2000 + Math.random() * 1000,
            onComplete: () => conf.destroy(),
          });
        }
      });
    }
  }

  shutdown(): void {
    if (this.effectsManager) this.effectsManager.destroy();
    this.audioEngine.destroy();
  }
}
