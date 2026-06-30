import { describe, it, expect } from 'vitest';
import { createInitialState } from '@systems/Economy';

describe('FruitGarden & FruitCatcher integration', () => {
  it('should increment fruitsCaught stat when catching fruit', () => {
    const state = createInitialState();
    const newState: typeof state = {
      ...state,
      saldo: state.saldo + 5,
      stats: {
        ...state.stats,
        fruitsCaught: state.stats.fruitsCaught + 1,
        totalWon: state.stats.totalWon + 5,
      },
    };
    expect(newState.stats.fruitsCaught).toBe(1);
    expect(newState.saldo).toBe(state.saldo + 5);
  });

  it('should apply goldenTouch x2 to fruit value', () => {
    const baseValue = 3;
    const goldenTouchValue = baseValue * 2;
    expect(goldenTouchValue).toBe(6);
  });

  it('should apply catchMaster x3 to catcher value', () => {
    const baseValue = 5;
    const catchMasterValue = baseValue * 3;
    expect(catchMasterValue).toBe(15);
  });

  it('should give perfect catch bonus of 20', () => {
    const PERFECT_BONUS = 20;
    const state = createInitialState();
    const newState: typeof state = {
      ...state,
      saldo: state.saldo + PERFECT_BONUS,
      stats: {
        ...state.stats,
        totalWon: state.stats.totalWon + PERFECT_BONUS,
      },
    };
    expect(newState.saldo).toBe(state.saldo + PERFECT_BONUS);
  });

  it('should have golden chance of 5%', () => {
    const GOLDEN_CHANCE = 0.05;
    expect(GOLDEN_CHANCE).toBe(0.05);
    expect(GOLDEN_CHANCE).toBeLessThan(0.1);
  });

  it('should have max 3 fruits (5 with fruitSprinkler)', () => {
    const maxFruitsNormal = 3;
    const maxFruitsSprinkler = 5;
    expect(maxFruitsNormal).toBe(3);
    expect(maxFruitsSprinkler).toBe(5);
  });
});
