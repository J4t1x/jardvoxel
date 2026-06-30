import Phaser from 'phaser';
import { SCENES } from '@config/phaser.config';
import { COLORS, RARITY_LABELS, RARITY_COLORS, BALANCE } from '@config/balance';
import { useGameStore } from '@store/gameStore';
import { SaveManager } from '@store/SaveManager';
import { AudioEngine } from '@audio/AudioEngine';
import { MysteryBox, type MysteryBoxResult } from '@systems/MysteryBox';

export class MysteryScene extends Phaser.Scene {
  private audioEngine: AudioEngine = new AudioEngine();
  private box!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private continueBtn!: Phaser.GameObjects.Text;
  private rarityBanner!: Phaser.GameObjects.Text;
  private charged: boolean = false;

  constructor() {
    super({ key: SCENES.MYSTERY });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const { width, height } = this.cameras.main;
    this.audioEngine.init();

    this.add.text(width / 2, 80, '🎁 MYSTERY BOX', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '36px',
      color: COLORS.purple,
    }).setOrigin(0.5);

    this.box = this.add.text(width / 2, height / 2 - 30, '🎁', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '96px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const hint = this.add.text(width / 2, height / 2 + 60, '👆 Toca para abrir', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.muted,
    }).setOrigin(0.5);

    this.rarityBanner = this.add.text(width / 2, height / 2 - 120, '', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5).setVisible(false);

    this.resultText = this.add.text(width / 2, height / 2 + 100, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: COLORS.text,
      wordWrap: { width: 400 },
    }).setOrigin(0.5).setVisible(false);

    this.continueBtn = this.add.text(width / 2, height - 80, 'CONTINUAR', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '20px',
      color: COLORS.text,
      backgroundColor: COLORS.green,
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.continueBtn.on('pointerdown', () => {
      useGameStore.getState().set({ mysteryBoxPendiente: false });
      SaveManager.save(useGameStore.getState());
      this.audioEngine.destroy();
      this.scene.stop();
      this.scene.resume(SCENES.SLOT);
    });

    this.box.on('pointerdown', () => {
      if (!this.charged) {
        this.charged = true;
        this.box.setStyle({ fontSize: '110px' });
        hint.setText('⚡ Cargando... toca de nuevo!');
        this.audioEngine.sfx('mysteryCharge');
        this.audioEngine.vibrate(20);
        this.tweens.add({
          targets: this.box,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 300,
          yoyo: true,
        });
        this.time.delayedCall(600, () => {
          this.box.setStyle({ fontSize: '96px' });
          hint.setText('💥 ¡AHORA!');
        });
        return;
      }

      this.box.removeInteractive();
      hint.setVisible(false);
      this.audioEngine.sfx('mysteryExplode');
      this.audioEngine.vibrate([50, 30, 80, 50, 100]);

      this.tweens.add({
        targets: this.box,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => {
          this.box.setVisible(false);
          this.revealReward();
        },
      });
    });
  }

  private revealReward(): void {
    const state = useGameStore.getState();
    const result = MysteryBox.roll(state);
    this.applyResult(result);

    this.time.delayedCall(500, () => {
      this.rarityBanner.setText(RARITY_LABELS[result.rarity]);
      this.rarityBanner.setColor(RARITY_COLORS[result.rarity]);
      this.rarityBanner.setVisible(true);
      if (result.rarity === 'legendary' || result.rarity === 'mythic') {
        this.audioEngine.sfx('mysteryRevealRare');
      } else {
        this.audioEngine.sfx('mysteryReveal');
      }
    });

    this.time.delayedCall(800, () => {
      this.resultText.setText(`${result.icon} ${result.text}`);
      this.resultText.setVisible(true);
      this.continueBtn.setVisible(true);
    });
  }

  private applyResult(result: MysteryBoxResult): void {
    const state = useGameStore.getState();
    const newState = { ...state };

    switch (result.type) {
      case 'coins':
      case 'bigCoins':
      case 'megaJackpot':
        newState.saldo += result.amount;
        break;
      case 'fever':
        newState.fruitFever = true;
        newState.feverGiros = BALANCE.feverSpins / 2;
        break;
      case 'goldenHour':
        newState.fruitFever = true;
        newState.feverGiros = BALANCE.goldenHourSpins;
        newState.goldenHourMult = BALANCE.goldenHourMultiplier;
        break;
      case 'upgrade':
        if (result.upgradeKey) {
          newState.upgrades = { ...newState.upgrades, [result.upgradeKey]: true };
        }
        break;
    }

    useGameStore.getState().set(newState);
    SaveManager.save(newState);
  }

  shutdown(): void {
    this.audioEngine.destroy();
  }
}
