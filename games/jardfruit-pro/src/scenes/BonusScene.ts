import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS } from '@config/balance';
import { BONUS_SYMS } from '@config/symbols';
import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';
import { BonusRound } from '@systems/BonusRound';

export class BonusScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private attempts: number = 0;
  private prizes: number = 0;
  private apuesta: number = 50;
  private attemptsText!: Phaser.GameObjects.Text;
  private prizesText!: Phaser.GameObjects.Text;
  private reelTexts: Phaser.GameObjects.Text[] = [];
  private borderItems: Phaser.GameObjects.Text[] = [];
  private litIdx: number = 0;
  private illuminTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({ key: SCENES.BONUS });
  }

  init(data: { fresasCount: number }): void {
    this.attempts = BonusRound.getInitialAttempts(data.fresasCount);
    this.prizes = 0;
    const state = useGameStore.getState();
    this.apuesta = state.apuestaActual;

    useGameStore.getState().set({
      enBono: true,
      bonoIntentos: this.attempts,
      bonoPremios: 0,
      stats: {
        ...state.stats,
        bonosTriggered: state.stats.bonosTriggered + 1,
      },
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const { width, height } = this.cameras.main;

    this.audioEngine.init();
    this.audioEngine.startMusic('bonus');

    this.add.text(width / 2, 60, '🍓 BONUS ROUND', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '48px',
      color: COLORS.gold,
      stroke: COLORS.red,
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.attemptsText = this.add.text(width / 2, 130, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: COLORS.text,
    }).setOrigin(0.5);

    this.prizesText = this.add.text(width / 2, 165, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: COLORS.gold,
    }).setOrigin(0.5);

    for (let i = 0; i < 3; i++) {
      const txt = this.add.text(width / 2 - 120 + i * 120, height / 2 - 40, '?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
      }).setOrigin(0.5);
      this.reelTexts.push(txt);
    }

    const allItems = [...BONUS_SYMS, 'EXIT'];
    const radius = 180;
    const centerX = width / 2;
    const centerY = height / 2 + 60;
    allItems.forEach((sym, i) => {
      const angle = (i / allItems.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const txt = this.add.text(x, y, sym === 'EXIT' ? 'EXIT' : sym, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: COLORS.text,
        backgroundColor: COLORS.surface,
        padding: { x: 12, y: 8 },
      }).setOrigin(0.5);
      txt.setData('symbol', sym);
      this.borderItems.push(txt);
    });

    this.updateBonusHUD();
    this.time.delayedCall(1000, () => this.doBonusSpin());
  }

  private updateBonusHUD(): void {
    let stars = '';
    for (let i = 0; i < this.attempts; i++) stars += '⭐';
    this.attemptsText.setText(`Intentos: ${stars}`);
    this.prizesText.setText(`Premios: 🪙 ${this.prizes}`);
  }

  private async doBonusSpin(): Promise<void> {
    if (this.attempts <= 0) {
      this.endBonus();
      return;
    }

    let idx = 0;
    this.illuminTimer = setInterval(() => {
      this.borderItems.forEach((el) => el.setStyle({ color: COLORS.text }));
      this.borderItems[idx % this.borderItems.length].setStyle({ color: COLORS.gold });
      idx++;
    }, 200);

    const spinInt = setInterval(() => {
      this.reelTexts.forEach((el) => {
        el.setText(BONUS_SYMS[Math.floor(Math.random() * BONUS_SYMS.length)]);
      });
    }, 80);

    await new Promise((r) => setTimeout(r, 1500));
    clearInterval(spinInt);
    if (this.illuminTimer) clearInterval(this.illuminTimer);

    const finals = BonusRound.generateFinals();
    this.reelTexts.forEach((el, i) => el.setText(finals[i]));

    const litSymbol = BonusRound.pickLitSymbol();
    const litItem = this.borderItems.find((el) => el.getData('symbol') === litSymbol);
    this.borderItems.forEach((el) => el.setStyle({ color: COLORS.text }));
    if (litItem) litItem.setStyle({ color: COLORS.gold });

    this.audioEngine.sfx('reelStop');
    this.audioEngine.vibrate(20);

    await new Promise((r) => setTimeout(r, 500));

    const result = BonusRound.evaluate(litSymbol, finals, this.apuesta);

    if (result.exit) {
      const state = useGameStore.getState();
      if (state.upgrades.streakSaver) {
        const newUpgrades = { ...state.upgrades, streakSaver: false };
        useGameStore.getState().set({ upgrades: newUpgrades });
      } else {
        this.attempts--;
        this.audioEngine.sfx('gambleLoss');
      }
    } else if (result.matched) {
      this.prizes += result.premio;
      const state = useGameStore.getState();
      useGameStore.getState().set({
        saldo: state.saldo + result.premio,
        stats: { ...state.stats, totalWon: state.stats.totalWon + result.premio },
      });
      this.audioEngine.sfx('win');
      this.audioEngine.vibrate([30, 20, 30]);
      this.reelTexts.forEach((el) => {
        if (el.text === litSymbol) el.setStyle({ color: COLORS.green });
      });
    } else {
      // no match
    }

    this.updateBonusHUD();
    SaveManager.save(useGameStore.getState());

    this.time.delayedCall(1500, () => this.doBonusSpin());
  }

  private endBonus(): void {
    useGameStore.getState().set({
      enBono: false,
      bonoIntentos: 0,
      bonoPremios: this.prizes,
    });
    SaveManager.save(useGameStore.getState());
    this.audioEngine.destroy();
    this.scene.stop();
    this.scene.resume(SCENES.SLOT);
  }

  shutdown(): void {
    if (this.illuminTimer) clearInterval(this.illuminTimer);
    this.audioEngine.destroy();
  }
}
