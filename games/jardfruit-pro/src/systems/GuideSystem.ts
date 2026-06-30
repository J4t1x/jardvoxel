import Phaser from 'phaser';
import { useGameStore } from '@store/gameStore';
import { LINEAS, LINEA_EXTRA } from '@config/paylines';
import { REELS_COUNT, ROWS_COUNT } from '@config/symbols';

const REEL_W = 140;
const REEL_H = 360;
const SYM_H = REEL_H / ROWS_COUNT;
const REEL_GAP = 12;

const LINE_COLORS = ['#ffd700', '#ffd700', '#ffd700', '#9b46ff', '#9b46ff'];
const EXTRA_LINE_COLOR = '#00ff88';

export class GuideSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private ghostTexts: Phaser.GameObjects.Text[] = [];
  private probDots: Phaser.GameObjects.Arc[] = [];
  private active: boolean = false;
  private reelStartX: number;
  private reelStartY: number;

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.scene = scene;
    this.reelStartX = startX;
    this.reelStartY = startY;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(50);
  }

  toggle(): void {
    const s = useGameStore.getState();
    const newState = !s.showGuides;
    useGameStore.getState().set({ showGuides: newState });
    this.active = newState;
    if (newState) {
      this.drawGuides();
      this.showGhostSymbols();
      this.showProbabilityHints();
    } else {
      this.clearAll();
    }
  }

  init(): void {
    const s = useGameStore.getState();
    this.active = !!s.showGuides;
    if (this.active) {
      this.drawGuides();
      this.showGhostSymbols();
      this.showProbabilityHints();
    }
  }

  private drawGuides(): void {
    this.graphics.clear();

    for (let i = 0; i < LINEAS.length; i++) {
      const line = LINEAS[i];
      const color = Phaser.Display.Color.HexStringToColor(LINE_COLORS[i]).color;
      this.drawLine(line, color, 0.4);
    }

    const s = useGameStore.getState();
    if (s.upgrades.extraLine) {
      this.drawLine(LINEA_EXTRA, Phaser.Display.Color.HexStringToColor(EXTRA_LINE_COLOR).color, 0.4);
    }
  }

  private drawLine(line: [number, number][], color: number, alpha: number): void {
    this.graphics.lineStyle(3, color, alpha);
    this.graphics.beginPath();
    for (let i = 0; i < line.length; i++) {
      const [reel, row] = line[i];
      const x = this.reelStartX + reel * (REEL_W + REEL_GAP) + REEL_W / 2;
      const y = this.reelStartY + row * SYM_H + SYM_H / 2;
      if (i === 0) this.graphics.moveTo(x, y);
      else this.graphics.lineTo(x, y);
    }
    this.graphics.strokePath();
  }

  flashAllLines(): void {
    if (!this.active) return;
    this.graphics.clear();
    for (let i = 0; i < LINEAS.length; i++) {
      this.drawLine(LINEAS[i], Phaser.Display.Color.HexStringToColor(LINE_COLORS[i]).color, 0.8);
    }
    const s = useGameStore.getState();
    if (s.upgrades.extraLine) {
      this.drawLine(LINEA_EXTRA, Phaser.Display.Color.HexStringToColor(EXTRA_LINE_COLOR).color, 0.8);
    }
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.4,
      duration: 300,
    });
  }

  hideGuides(): void {
    this.graphics.clear();
    this.ghostTexts.forEach((t) => t.setVisible(false));
  }

  showGuides(): void {
    if (!this.active) return;
    this.drawGuides();
    this.ghostTexts.forEach((t) => t.setVisible(true));
  }

  updateActiveLines(grid: { emoji: string }[][], spinningReel: number): void {
    if (!this.active) return;
    this.graphics.clear();

    for (let i = 0; i < LINEAS.length; i++) {
      const line = LINEAS[i];
      let matchCount = 0;
      const firstSym = grid[line[0][0]][line[0][1]].emoji;
      for (let j = 0; j <= spinningReel && j < line.length; j++) {
        const [reel, row] = line[j];
        if (grid[reel][row].emoji === firstSym) matchCount++;
        else break;
      }

      let alpha = 0.2;
      const color = Phaser.Display.Color.HexStringToColor(LINE_COLORS[i]).color;

      if (matchCount >= 3) {
        alpha = 0.8;
        if (matchCount >= 4 && spinningReel === 3) {
          this.scene.tweens.add({
            targets: this.graphics,
            alpha: { from: 0.8, to: 1 },
            duration: 150,
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        alpha = 0.1;
      }

      this.drawLine(line, color, alpha);
    }
  }

  private showGhostSymbols(): void {
    this.ghostTexts.forEach((t) => t.destroy());
    this.ghostTexts = [];

    const ghostEmojis = ['🍒', '🍑', '🍋', '🍎', '🍐', '🍉', '🍹', '🌟'];
    for (let r = 0; r < REELS_COUNT; r++) {
      const x = this.reelStartX + r * (REEL_W + REEL_GAP) + REEL_W / 2;
      for (let g = 0; g < 2; g++) {
        const emoji = ghostEmojis[Math.floor(Math.random() * ghostEmojis.length)];
        const y = this.reelStartY + (g === 0 ? -SYM_H / 2 : REEL_H + SYM_H / 2);
        const text = this.scene.add.text(x, y, emoji, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '28px',
        }).setOrigin(0.5).setAlpha(0.15).setDepth(40);
        this.ghostTexts.push(text);
      }
    }
  }

  private showProbabilityHints(): void {
    this.probDots.forEach((d) => d.destroy());
    this.probDots = [];

    for (let r = 0; r < REELS_COUNT; r++) {
      const x = this.reelStartX + r * (REEL_W + REEL_GAP) + REEL_W / 2;
      const y = this.reelStartY + REEL_H + 15;
      const dot = this.scene.add.circle(x, y, 4, 0xffd700, 0.3);
      dot.setDepth(45);
      this.probDots.push(dot);
    }
  }

  private clearAll(): void {
    this.graphics.clear();
    this.ghostTexts.forEach((t) => t.destroy());
    this.ghostTexts = [];
    this.probDots.forEach((d) => d.destroy());
    this.probDots = [];
  }

  destroy(): void {
    this.clearAll();
    this.graphics.destroy();
  }
}
