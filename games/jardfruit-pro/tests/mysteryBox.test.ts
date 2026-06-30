import { describe, it, expect } from 'vitest';
import { MysteryBox } from '@systems/MysteryBox';
import { createInitialState } from '@systems/Economy';

describe('MysteryBox', () => {
  it('should roll and return a valid result type', () => {
    const state = createInitialState();
    const result = MysteryBox.roll(state);
    const validTypes = ['coins', 'fever', 'upgrade', 'bigCoins', 'goldenHour', 'megaJackpot'];
    expect(validTypes).toContain(result.type);
  });

  it('should return coins result with positive amount', () => {
    const state = createInitialState();
    let foundCoins = false;
    for (let i = 0; i < 100; i++) {
      const result = MysteryBox.roll(state);
      if (result.type === 'coins') {
        expect(result.amount).toBeGreaterThan(0);
        expect(result.rarity).toBe('common');
        foundCoins = true;
        break;
      }
    }
    expect(foundCoins).toBe(true);
  });

  it('should return megaJackpot with amount 5000', () => {
    const state = createInitialState();
    let foundJackpot = false;
    for (let i = 0; i < 1000; i++) {
      const result = MysteryBox.roll(state);
      if (result.type === 'megaJackpot') {
        expect(result.amount).toBe(5000);
        expect(result.rarity).toBe('mythic');
        foundJackpot = true;
        break;
      }
    }
    expect(foundJackpot).toBe(true);
  });

  it('should return upgrade with valid upgradeKey when upgrades available', () => {
    const state = createInitialState();
    state.upgrades = { luckyStraw: false, multiplierBoost: false };
    let foundUpgrade = false;
    for (let i = 0; i < 200; i++) {
      const result = MysteryBox.roll(state);
      if (result.type === 'upgrade') {
        expect(result.upgradeKey).toBeDefined();
        expect(state.upgrades).toHaveProperty(result.upgradeKey!);
        foundUpgrade = true;
        break;
      }
    }
    expect(foundUpgrade).toBe(true);
  });

  it('shouldTrigger returns boolean', () => {
    const result = MysteryBox.shouldTrigger();
    expect(typeof result).toBe('boolean');
  });
});
