import { describe, it, expect } from 'vitest';
import { BonusRound } from '@systems/BonusRound';
import { BONUS_SYMS } from '@config/symbols';

describe('BonusRound', () => {
  it('should generate finals array with correct length', () => {
    const finals = BonusRound.generateFinals();
    expect(finals).toHaveLength(BONUS_SYMS.length);
    finals.forEach((f) => {
      expect(BONUS_SYMS).toContain(f);
    });
  });

  it('should pick a lit symbol (usually not EXIT)', () => {
    let exitCount = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const lit = BonusRound.pickLitSymbol();
      if (lit === 'EXIT') exitCount++;
      else expect(BONUS_SYMS).toContain(lit);
    }
    expect(exitCount).toBeLessThan(iterations * 0.3);
  });

  it('should evaluate EXIT correctly', () => {
    const result = BonusRound.evaluate('EXIT', ['fresa', 'fresa'], 100);
    expect(result.exit).toBe(true);
    expect(result.matched).toBe(false);
    expect(result.premio).toBe(0);
  });

  it('should evaluate matched symbol with prize', () => {
    const lit = 'fresa';
    const finals = ['fresa', 'limon', 'fresa'];
    const result = BonusRound.evaluate(lit, finals, 100);
    expect(result.matched).toBe(true);
    expect(result.exit).toBe(false);
    expect(result.premio).toBeGreaterThan(0);
  });

  it('should evaluate non-matched with zero prize', () => {
    const result = BonusRound.evaluate('fresa', ['limon', 'limon', 'limon'], 100);
    expect(result.matched).toBe(false);
    expect(result.premio).toBe(0);
  });

  it('should calculate initial attempts as fresasCount - 2', () => {
    expect(BonusRound.getInitialAttempts(3)).toBe(1);
    expect(BonusRound.getInitialAttempts(5)).toBe(3);
    expect(BonusRound.getInitialAttempts(10)).toBe(8);
  });
});
