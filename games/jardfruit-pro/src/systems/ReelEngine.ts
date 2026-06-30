import { RNG } from './RNG';
import { REELS_COUNT, ROWS_COUNT, type SymbolConfig } from '@config/symbols';

export interface ReelStopResult {
  finalSymbols: SymbolConfig[];
  spinSymbols: SymbolConfig[];
}

export class ReelEngine {
  private rng: RNG;
  private reels: SymbolConfig[][] = [];
  private spinning: boolean[] = [];

  constructor(rng: RNG) {
    this.rng = rng;
    this.reels = Array.from({ length: REELS_COUNT }, () => rng.generateReel());
    this.spinning = Array(REELS_COUNT).fill(false);
  }

  getReels(): SymbolConfig[][] {
    return this.reels;
  }

  getSymbol(reel: number, row: number): SymbolConfig {
    return this.reels[reel]?.[row] ?? this.rng.generateSymbol();
  }

  isSpinning(reel: number): boolean {
    return this.spinning[reel] ?? false;
  }

  isAnySpinning(): boolean {
    return this.spinning.some((s) => s);
  }

  spinReel(reel: number, duration: number): Promise<ReelStopResult> {
    return new Promise((resolve) => {
      this.spinning[reel] = true;
      const finalSymbols = this.rng.generateReel();
      const spinSymbols: SymbolConfig[] = [];
      for (let i = 0; i < 30; i++) spinSymbols.push(this.rng.generateSymbol());
      spinSymbols.push(...finalSymbols);

      setTimeout(() => {
        this.reels[reel] = finalSymbols;
        this.spinning[reel] = false;
        resolve({ finalSymbols, spinSymbols });
      }, duration);
    });
  }

  async spinAll(
    baseDuration: number,
    stagger: number,
    anticipation: boolean,
    onReelStop?: (reel: number) => void,
  ): Promise<void> {
    const promises: Promise<ReelStopResult>[] = [];
    for (let i = 0; i < REELS_COUNT; i++) {
      let dur = baseDuration + i * stagger;
      if (anticipation && i === 4) dur += 600;
      const p = this.spinReel(i, dur).then((result) => {
        onReelStop?.(i);
        return result;
      });
      promises.push(p);
    }
    await Promise.all(promises);
  }

  nudgeReel(reel: number): void {
    const cur = this.reels[reel];
    this.reels[reel] = [this.rng.generateSymbol(), cur[0], cur[1]];
  }

  getGrid(): SymbolConfig[][] {
    return this.reels;
  }
}

export { REELS_COUNT, ROWS_COUNT };
