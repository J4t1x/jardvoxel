import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS } from '@config/balance';

import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';

const STEPS = [
  { icon: '🎰', title: '¡Bienvenido!', text: 'Bienvenido a JardFruit Pro. Toca GIRAR para jugar.' },
  { icon: '🪙', title: 'Apuestas', text: 'Selecciona tu apuesta con los botones 10/50/100/500 o ALL.' },
  { icon: '🍹', title: 'Wild', text: 'El Wild 🍹 sustituye cualquier símbolo excepto scatter y bonus.' },
  { icon: '🌟', title: 'Scatter', text: '3+ Scatters 🌟 activan free spins con multiplicador x2.' },
  { icon: '🍓', title: 'Bonus', text: '3+ Bonus 🍓 activan la ronda de bono para ganar premios extra.' },
  { icon: '💎', title: 'Jackpot', text: '5 Wilds 🍹 en una línea ganan el jackpot progresivo. ¡Suerte!' },
];

export class TutorialScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private currentStep: number = 0;
  private container: Phaser.GameObjects.Container = null!;

  constructor() {
    super({ key: SCENES.TUTORIAL });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.audioEngine.init();

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(90);

    this.container = this.add.container(0, 0).setDepth(100);

    const panelW = 600;
    const panelH = 400;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH,
      Phaser.Display.Color.HexStringToColor(COLORS.surface).color, 0.95);
    panel.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.gold).color);
    this.container.add(panel);

    this.renderStep();

    this.input.keyboard?.on('keydown-ESC', () => this.skip());
  }

  private renderStep(): void {
    const { width, height } = this.cameras.main;
    const step = STEPS[this.currentStep];

    this.container.getAll().forEach((obj) => {
      if (obj.getData('step-content')) obj.destroy();
    });

    const icon = this.add.text(width / 2, height / 2 - 120, step.icon, { fontSize: '64px' })
      .setOrigin(0.5).setData('step-content', true);
    this.container.add(icon);

    const title = this.add.text(width / 2, height / 2 - 40, step.title, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '24px', color: COLORS.gold,
    }).setOrigin(0.5).setData('step-content', true);
    this.container.add(title);

    const text = this.add.text(width / 2, height / 2 + 10, step.text, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.text,
      align: 'center', wordWrap: { width: 500 },
    }).setOrigin(0.5).setData('step-content', true);
    this.container.add(text);

    const dotsY = height / 2 + 80;
    for (let i = 0; i < STEPS.length; i++) {
      const dot = this.add.circle(width / 2 - (STEPS.length - 1) * 10 + i * 20, dotsY, 5,
        i <= this.currentStep ? Phaser.Display.Color.HexStringToColor(COLORS.gold).color : Phaser.Display.Color.HexStringToColor(COLORS.muted).color,
      ).setData('step-content', true);
      this.container.add(dot);
    }

    const isLast = this.currentStep === STEPS.length - 1;
    const btnText = isLast ? '¡JUGAR!' : 'Siguiente →';
    const btn = this.add.text(width / 2, height / 2 + 130, btnText, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '18px',
      color: COLORS.text, backgroundColor: isLast ? COLORS.green : COLORS.surface,
      padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setData('step-content', true);

    btn.on('pointerdown', () => {
      this.audioEngine.sfx('tapFruit');
      if (isLast) {
        this.finish();
      } else {
        this.currentStep++;
        this.renderStep();
      }
    });
    this.container.add(btn);

    const skip = this.add.text(width / 2, height / 2 + 170, 'Saltar', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLORS.muted,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setData('step-content', true);
    skip.on('pointerdown', () => this.skip());
    this.container.add(skip);
  }

  private skip(): void {
    this.finish();
  }

  private finish(): void {
    useGameStore.getState().set({ tutorialVisto: true });
    SaveManager.save(useGameStore.getState());
    this.audioEngine.destroy();
    this.scene.stop();
    this.scene.resume(SCENES.SLOT);
  }

  shutdown(): void {
    this.audioEngine.destroy();
  }
}
