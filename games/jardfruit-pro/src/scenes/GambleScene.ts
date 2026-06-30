import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS, BALANCE } from '@config/balance';
import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';
import { GambleRound } from '@systems/GambleRound';

export class GambleScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private premioOriginal: number = 0;
  private premioAcumulado: number = 0;
  private rondas: number = 0;
  private consWins: number = 0;
  private dealerValue: number = 0;
  private dealerCard!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Text[] = [];
  private premioText!: Phaser.GameObjects.Text;
  private rondaText!: Phaser.GameObjects.Text;
  private streakDots: Phaser.GameObjects.Text[] = [];
  private cobrarBtn!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.GAMBLE });
  }

  init(data: { premio: number }): void {
    this.premioOriginal = data.premio;
    this.premioAcumulado = data.premio;
    this.rondas = 1;
    this.consWins = 0;
    useGameStore.getState().set({
      enGamble: true,
      gambleRondas: 1,
      gamblePremioAcumulado: data.premio,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const { width, height } = this.cameras.main;

    this.audioEngine.init();
    this.audioEngine.startMusic('gamble');

    this.add.text(width / 2, 50, '🃏 DOBLE O NADA', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '36px',
      color: COLORS.gold,
    }).setOrigin(0.5);

    this.premioText = this.add.text(width / 2, 100, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '28px',
      color: COLORS.gold,
    }).setOrigin(0.5);

    this.rondaText = this.add.text(width / 2, 135, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'Crupier:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    this.dealerCard = this.add.text(width / 2, 210, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      backgroundColor: COLORS.surface,
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5);

    this.add.text(width / 2, 280, 'Elige una carta:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    for (let i = 0; i < 4; i++) {
      const x = width / 2 - 180 + i * 120;
      const card = this.add.text(x, 350, '🂠', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        backgroundColor: COLORS.surface,
        padding: { x: 20, y: 12 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      card.on('pointerdown', () => this.selectCard(i));
      this.cards.push(card);
    }

    for (let i = 0; i < 5; i++) {
      const dot = this.add.text(width / 2 - 60 + i * 30, 430, '○', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: COLORS.muted,
      }).setOrigin(0.5);
      this.streakDots.push(dot);
    }

    this.cobrarBtn = this.add.text(width / 2, height - 80, '💰 COBRAR', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: COLORS.text,
      backgroundColor: COLORS.green,
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.cobrarBtn.on('pointerdown', () => this.cobrar());

    this.renderCards();
    this.updateHUD();
  }

  private renderCards(): void {
    this.dealerValue = GambleRound.generateDealerValue();
    this.dealerCard.setText(GambleRound.cardEmoji(this.dealerValue) + GambleRound.randomSuit());
    this.cards.forEach((c) => {
      c.setText('🂠');
      c.setStyle({ color: COLORS.text });
      c.removeInteractive();
      c.setInteractive({ useHandCursor: true });
    });
  }

  private updateHUD(): void {
    this.premioText.setText(`🪙 ${this.premioAcumulado}`);
    this.rondaText.setText(`Ronda ${this.rondas}/${BALANCE.gambleMaxRounds}`);
    this.streakDots.forEach((d, i) => {
      d.setText(i < this.consWins ? '●' : '○');
      d.setStyle({ color: i < this.consWins ? COLORS.green : COLORS.muted });
    });
  }

  private selectCard(idx: number): void {
    this.cards.forEach((c) => c.removeInteractive());
    this.cobrarBtn.removeInteractive();

    const playerValue = GambleRound.generatePlayerValue();
    const card = this.cards[idx];
    card.setText(GambleRound.cardEmoji(playerValue) + GambleRound.randomSuit());
    this.audioEngine.sfx('gambleCard');
    this.audioEngine.vibrate(30);

    this.time.delayedCall(800, () => {
      const state = useGameStore.getState();
      const result = GambleRound.evaluate(playerValue, this.dealerValue, !!state.upgrades.insurance);

      if (result.outcome === 'win') {
        card.setStyle({ color: COLORS.green });
        this.premioAcumulado *= result.multiplier;
        this.consWins++;
        const s = useGameStore.getState();
        useGameStore.getState().set({
          stats: { ...s.stats, gambleWins: s.stats.gambleWins + 1 },
        });
        this.audioEngine.sfx('gambleWin');
        this.audioEngine.vibrate([30, 20, 50]);
        if (this.rondas >= BALANCE.gambleMaxRounds) {
          this.cobrar();
        } else {
          this.rondas++;
          this.updateHUD();
          this.time.delayedCall(1500, () => {
            this.renderCards();
            this.updateHUD();
            this.cobrarBtn.setInteractive({ useHandCursor: true });
          });
        }
      } else {
        card.setStyle({ color: COLORS.red });
        const s = useGameStore.getState();
        useGameStore.getState().set({
          stats: { ...s.stats, gambleLosses: s.stats.gambleLosses + 1 },
        });
        this.audioEngine.sfx('gambleLoss');
        this.audioEngine.vibrate(100);
        this.time.delayedCall(1500, () => this.endGamble(false));
      }
    });
  }

  private cobrar(): void {
    this.endGamble(true);
  }

  private endGamble(cobrado: boolean): void {
    const state = useGameStore.getState();
    if (cobrado) {
      const extra = this.premioAcumulado - this.premioOriginal;
      useGameStore.getState().set({
        enGamble: false,
        saldo: state.saldo + extra,
        stats: { ...state.stats, totalWon: state.stats.totalWon + extra },
      });
      this.audioEngine.sfx('coin');
    } else {
      useGameStore.getState().set({
        enGamble: false,
        saldo: Math.max(0, state.saldo - this.premioOriginal),
      });
    }
    SaveManager.save(useGameStore.getState());
    this.audioEngine.destroy();
    this.scene.stop();
    this.scene.resume(SCENES.SLOT);
  }

  shutdown(): void {
    this.audioEngine.destroy();
  }
}
