import { describe, it, expect } from 'vitest';
import { RNG } from '@systems/RNG';
import { SIMBOLOS } from '@config/symbols';

describe('RNG', () => {
  it('should generate a valid symbol', () => {
    const rng = new RNG();
    const sym = rng.generateSymbol();
    expect(SIMBOLOS).toContainEqual(expect.objectContaining({ nombre: sym.nombre }));
  });

  it('should generate a reel with 3 symbols', () => {
    const rng = new RNG();
    const reel = rng.generateReel();
    expect(reel).toHaveLength(3);
    reel.forEach((s) => {
      expect(SIMBOLOS).toContainEqual(expect.objectContaining({ nombre: s.nombre }));
    });
  });

  it('should generate a 5x3 grid', () => {
    const rng = new RNG();
    const grid = rng.generateGrid();
    expect(grid).toHaveLength(5);
    grid.forEach((reel) => expect(reel).toHaveLength(3));
  });

  it('should respect lucky straw bonus', () => {
    const rng = new RNG();
    rng.setLuckyStraw(true);
    let bonusCount = 0;
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      const sym = rng.generateSymbol();
      if (sym.bonus) bonusCount++;
    }
    const bonusSym = SIMBOLOS.find((s) => s.bonus)!;
    const baseRate = bonusSym.peso / SIMBOLOS.reduce((sum, s) => sum + s.peso, 0);
    const expectedMin = baseRate * iterations * 0.8;
    expect(bonusCount).toBeGreaterThan(expectedMin);
  });

  it('should produce roughly uniform distribution across symbols', () => {
    const rng = new RNG();
    const counts: Record<string, number> = {};
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      const sym = rng.generateSymbol();
      counts[sym.nombre] = (counts[sym.nombre] ?? 0) + 1;
    }
    const cereza = SIMBOLOS.find((s) => s.nombre === 'cereza')!;
    const expectedCereza = (cereza.peso / SIMBOLOS.reduce((sum, s) => sum + s.peso, 0)) * iterations;
    expect(counts['cereza']).toBeGreaterThan(expectedCereza * 0.7);
    expect(counts['cereza']).toBeLessThan(expectedCereza * 1.3);
  });
});
