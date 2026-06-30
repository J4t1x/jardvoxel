import { describe, it, expect } from 'vitest';
import { PaylineChecker, type MultiplierParams } from '@systems/PaylineChecker';
import { SIMBOLOS, type SymbolConfig } from '@config/symbols';

const defaultParams: MultiplierParams = {
  multiplierBoost: false,
  doubleWild: false,
  fruitFever: false,
  goldenHourMult: 0,
  freeSpins: 0,
  freeSpinsMult: 2,
  prestigeMult: 1,
  tapCombo: 0,
  tapFrenzy: false,
};

function makeSymbol(nombre: string): SymbolConfig {
  return SIMBOLOS.find((s) => s.nombre === nombre)!;
}

function makeGrid(pattern: SymbolConfig[][]): SymbolConfig[][] {
  return pattern;
}

describe('PaylineChecker', () => {
  const cereza = makeSymbol('cereza');
  const durazno = makeSymbol('durazno');
  const wild = makeSymbol('wild');
  const scatter = makeSymbol('scatter');
  const bonus = makeSymbol('bonus');
  const limon = makeSymbol('limon');

  it('should detect 3 consecutive cherries on line 0 (LTR)', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    expect(result.premioTotal).toBeGreaterThan(0);
    expect(result.resultados.length).toBeGreaterThan(0);
  });

  it('should detect wins in both LTR and RTL directions', () => {
    const grid = makeGrid([
      [durazno, cereza, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    const dirs = result.resultados.map((r) => r.direccion);
    expect(dirs).toContain('ltr');
    expect(dirs).toContain('rtl');
  });

  it('should not count bonus or scatter symbols as line wins', () => {
    const grid = makeGrid([
      [bonus, scatter, bonus],
      [scatter, bonus, scatter],
      [bonus, scatter, bonus],
      [scatter, bonus, scatter],
      [bonus, scatter, bonus],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    expect(result.resultados.length).toBe(0);
  });

  it('should detect wild substitutions', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [wild, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    expect(result.tieneWild).toBe(true);
    expect(result.premioTotal).toBeGreaterThan(0);
  });

  it('should detect jackpot (5 wilds)', () => {
    const grid = makeGrid([
      [wild, cereza, limon],
      [wild, cereza, limon],
      [wild, cereza, limon],
      [wild, cereza, limon],
      [wild, cereza, limon],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    expect(result.jackpot).toBe(true);
  });

  it('should detect scatters and trigger free spins', () => {
    const grid = makeGrid([
      [scatter, cereza, limon],
      [cereza, scatter, limon],
      [durazno, cereza, scatter],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
    ]);
    const result = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    expect(result.scatters).toBe(3);
    expect(result.freeSpinsTriggered).toBe(true);
    expect(result.scatterWin).toBeGreaterThan(0);
  });

  it('should apply multiplierBoost correctly', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
    ]);
    const baseResult = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    const boostedResult = PaylineChecker.evaluate(grid, 50, false, {
      ...defaultParams,
      multiplierBoost: true,
    });
    expect(boostedResult.premioTotal).toBeGreaterThan(baseResult.premioTotal);
  });

  it('should apply fruitFever multiplier', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
    ]);
    const baseResult = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    const feverResult = PaylineChecker.evaluate(grid, 50, false, {
      ...defaultParams,
      fruitFever: true,
    });
    expect(feverResult.premioTotal).toBeGreaterThanOrEqual(baseResult.premioTotal * 2);
  });

  it('should apply tapCombo bonus when > 5', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
    ]);
    const baseResult = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    const comboResult = PaylineChecker.evaluate(grid, 50, false, {
      ...defaultParams,
      tapCombo: 15,
    });
    expect(comboResult.premioTotal).toBeGreaterThan(baseResult.premioTotal);
  });

  it('should detect near miss (4 consecutive)', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
    ]);
    const nm = PaylineChecker.detectNearMiss(grid, false);
    expect(nm).not.toBeNull();
    expect(nm!.cantidad).toBe(4);
  });

  it('should return null for near miss when 5 consecutive (it is a win)', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
    ]);
    const nm = PaylineChecker.detectNearMiss(grid, false);
    expect(nm).toBeNull();
  });

  it('should detect anticipation (3+ same symbols in first 4 reels)', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [cereza, durazno, limon],
      [durazno, cereza, limon],
    ]);
    expect(PaylineChecker.checkAnticipation(grid)).toBe(true);
  });

  it('should not detect anticipation when no matching symbols', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [durazno, limon, cereza],
      [limon, cereza, durazno],
      [cereza, limon, durazno],
      [durazno, cereza, limon],
    ]);
    expect(PaylineChecker.checkAnticipation(grid)).toBe(false);
  });

  it('should use extra line when enabled', () => {
    const grid = makeGrid([
      [cereza, durazno, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
      [durazno, cereza, limon],
      [cereza, durazno, limon],
    ]);
    const withoutExtra = PaylineChecker.evaluate(grid, 50, false, defaultParams);
    const withExtra = PaylineChecker.evaluate(grid, 50, true, defaultParams);
    expect(withExtra.resultados.length).toBeGreaterThanOrEqual(withoutExtra.resultados.length);
  });
});
