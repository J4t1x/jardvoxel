import { describe, it, expect } from 'vitest';
import { GambleRound } from '@systems/GambleRound';
import { BALANCE } from '@config/balance';

describe('GambleRound', () => {
  it('should generate dealer value between 2 and 14', () => {
    for (let i = 0; i < 100; i++) {
      const v = GambleRound.generateDealerValue();
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(14);
    }
  });

  it('should generate player value between 2 and 14', () => {
    for (let i = 0; i < 100; i++) {
      const v = GambleRound.generatePlayerValue();
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(14);
    }
  });

  it('should evaluate win when player > dealer', () => {
    const result = GambleRound.evaluate(14, 5, false);
    expect(result.outcome).toBe('win');
    expect(result.multiplier).toBe(2);
  });

  it('should evaluate lose when player < dealer', () => {
    const result = GambleRound.evaluate(2, 10, false);
    expect(result.outcome).toBe('lose');
    expect(result.multiplier).toBe(0);
  });

  it('should evaluate lose on tie without insurance', () => {
    const result = GambleRound.evaluate(7, 7, false);
    expect(result.outcome).toBe('lose');
    expect(result.multiplier).toBe(0);
  });

  it('should evaluate win on tie with insurance', () => {
    const result = GambleRound.evaluate(7, 7, true);
    expect(result.outcome).toBe('win');
    expect(result.multiplier).toBe(1);
  });

  it('should return correct card emoji for face cards', () => {
    expect(GambleRound.cardEmoji(2)).toBe('2');
    expect(GambleRound.cardEmoji(10)).toBe('10');
    expect(GambleRound.cardEmoji(11)).toBe('J');
    expect(GambleRound.cardEmoji(12)).toBe('Q');
    expect(GambleRound.cardEmoji(13)).toBe('K');
    expect(GambleRound.cardEmoji(14)).toBe('A');
  });

  it('should return a valid suit', () => {
    const suits = ['♥', '♦', '♠', '♣'];
    const suit = GambleRound.randomSuit();
    expect(suits).toContain(suit);
  });

  it('should return max rounds from balance config', () => {
    expect(GambleRound.maxRounds).toBe(BALANCE.gambleMaxRounds);
  });
});
