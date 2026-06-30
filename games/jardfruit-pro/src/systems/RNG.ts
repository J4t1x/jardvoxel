import { SIMBOLOS, type SymbolConfig } from '@config/symbols';

export class RNG {
  private luckyStraw: boolean = false;

  setLuckyStraw(enabled: boolean): void {
    this.luckyStraw = enabled;
  }

  generateSymbol(): SymbolConfig {
    let total = SIMBOLOS.reduce((s, sym) => s + sym.peso, 0);
    if (this.luckyStraw) total += 5;
    let r = Math.random() * total;
    for (const sym of SIMBOLOS) {
      r -= sym.peso;
      if (r <= 0) return sym;
    }
    if (this.luckyStraw) {
      r -= 5;
      if (r <= 0) return SIMBOLOS.find((s) => s.bonus) ?? SIMBOLOS[0];
    }
    return SIMBOLOS[0];
  }

  generateReel(): SymbolConfig[] {
    return [this.generateSymbol(), this.generateSymbol(), this.generateSymbol()];
  }

  generateGrid(): SymbolConfig[][] {
    return Array.from({ length: 5 }, () => this.generateReel());
  }

  static shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
