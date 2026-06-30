import Phaser from 'phaser';
import { AudioEngine } from '@audio/AudioEngine';
import { BALANCE } from '@config/balance';
import { LINEAS } from '@config/paylines';
import { REELS_COUNT } from '@config/symbols';
import { useGameStore } from '@store/gameStore';

const REEL_W = 140;
const REEL_H = 360;
const SYM_H = REEL_H / 3;
const REEL_GAP = 12;

export class NearMissSystem {
  private scene: Phaser.Scene;
  private audioEngine: AudioEngine;
  private reelStartX: number;
  private reelStartY: number;

  constructor(scene: Phaser.Scene, audioEngine: AudioEngine, startX: number, startY: number) {
    this.scene = scene;
    this.audioEngine = audioEngine;
    this.reelStartX = startX;
    this.reelStartY = startY;
  }

  showNearMiss(
    grid: { emoji: string; wild?: boolean; scatter?: boolean }[][],
    _extraLine: boolean,
  ): boolean {
    const nearMissLine = this.findNearMissLine(grid);
    if (!nearMissLine) return false;

    const { line, breakIdx, symbol } = nearMissLine;

    this.drawInterruptedLine(line, breakIdx);

    if (breakIdx < REELS_COUNT) {
      this.shakeReel(breakIdx);
    }

    this.showToast(symbol);

    this.audioEngine.sfx('nearMiss');
    this.audioEngine.vibrate([30, 20, 30]);

    this.flashPurple();

    const s = useGameStore.getState();
    useGameStore.getState().set({
      saldo: s.saldo + BALANCE.nearMissConsolation,
    });

    return true;
  }

  private findNearMissLine(
    grid: { emoji: string; wild?: boolean }[][],
  ): { line: [number, number][]; breakIdx: number; symbol: string } | null {
    for (const line of LINEAS) {
      const firstSym = grid[line[0][0]][line[0][1]].emoji;
      let matchCount = 1;
      let breakIdx = 1;

      for (let i = 1; i < line.length; i++) {
        const [reel, row] = line[i];
        if (grid[reel][row].emoji === firstSym || grid[reel][row].wild) {
          matchCount++;
        } else {
          breakIdx = i;
          break;
        }
      }

      if (matchCount === 4) {
        return { line, breakIdx, symbol: firstSym };
      }
    }
    return null;
  }

  private drawInterruptedLine(line: [number, number][], breakIdx: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(55);

    graphics.lineStyle(4, 0xff3333, 0.8);
    graphics.beginPath();
    for (let i = 0; i < breakIdx; i++) {
      const [reel, row] = line[i];
      const x = this.reelStartX + reel * (REEL_W + REEL_GAP) + REEL_W / 2;
      const y = this.reelStartY + row * SYM_H + SYM_H / 2;
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.strokePath();

    if (breakIdx < line.length) {
      const [reel, row] = line[breakIdx];
      const x = this.reelStartX + reel * (REEL_W + REEL_GAP) + REEL_W / 2;
      const y = this.reelStartY + row * SYM_H + SYM_H / 2;
      const prevX = this.reelStartX + line[breakIdx - 1][0] * (REEL_W + REEL_GAP) + REEL_W / 2;
      const prevY = this.reelStartY + line[breakIdx - 1][1] * SYM_H + SYM_H / 2;

      graphics.lineStyle(4, 0xff3333, 0.3);
      graphics.beginPath();
      graphics.moveTo(prevX, prevY);
      graphics.lineTo(x, y);
      graphics.strokePath();
    }

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 500,
      onComplete: () => graphics.destroy(),
    });
  }

  private shakeReel(_reelIdx: number): void {
    this.scene.cameras.main.shake(200, 0.005);
  }

  private showToast(symbol: string): void {
    const { width, height } = this.scene.cameras.main;
    const toast = this.scene.add.text(
      width / 2,
      height - 140,
      `¡CASI! 4/5 ${symbol}`,
      {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ff3333',
        backgroundColor: '#000000aa',
        padding: { x: 16, y: 8 },
      },
    ).setOrigin(0.5).setDepth(85).setScale(0);

    this.scene.tweens.add({
      targets: toast,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 800,
      onComplete: () => toast.destroy(),
    });
  }

  private flashPurple(): void {
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      width / 2, height / 2, width, height,
      Phaser.Display.Color.HexStringToColor('#9b46ff').color, 0.2,
    );
    flash.setDepth(90);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  destroy(): void {
  }
}
