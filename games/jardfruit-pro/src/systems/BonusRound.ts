import { BONUS_SYMS, BONUS_MULT } from '@config/symbols';

export interface BonusSpinResult {
  litSymbol: string;
  matched: boolean;
  exit: boolean;
  premio: number;
}

export class BonusRound {
  static generateFinals(): string[] {
    return BONUS_SYMS.map(() => BONUS_SYMS[Math.floor(Math.random() * BONUS_SYMS.length)]);
  }

  static pickLitSymbol(): string {
    const items = [...BONUS_SYMS, 'EXIT'];
    const litIdx = Math.random() < 0.85
      ? Math.floor(Math.random() * (items.length - 1))
      : items.length - 1;
    return items[litIdx];
  }

  static evaluate(
    litSymbol: string,
    finals: string[],
    apuesta: number,
  ): BonusSpinResult {
    if (litSymbol === 'EXIT') {
      return { litSymbol, matched: false, exit: true, premio: 0 };
    }
    const matched = finals.some((f) => f === litSymbol);
    if (matched) {
      const mult = BONUS_MULT[litSymbol] ?? 2;
      return { litSymbol, matched: true, exit: false, premio: apuesta * mult };
    }
    return { litSymbol, matched: false, exit: false, premio: 0 };
  }

  static getInitialAttempts(fresasCount: number): number {
    return fresasCount - 2;
  }
}
