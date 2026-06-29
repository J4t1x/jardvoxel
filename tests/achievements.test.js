import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, AchievementManager } from '../core/jardvoxel-survival-achievements.js';

describe('ACHIEVEMENTS', () => {
  it('has 30+ achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(30);
  });

  it('each achievement has id, name, desc, icon, category', () => {
    for (const ach of Object.values(ACHIEVEMENTS)) {
      expect(ach.id).toBeDefined();
      expect(ach.name).toBeDefined();
      expect(ach.desc).toBeDefined();
      expect(ach.icon).toBeDefined();
      expect(ach.category).toBeDefined();
    }
  });

  it('all categories are in ACHIEVEMENT_CATEGORIES', () => {
    for (const ach of Object.values(ACHIEVEMENTS)) {
      expect(ACHIEVEMENT_CATEGORIES).toContain(ach.category);
    }
  });
});

describe('AchievementManager', () => {
  it('starts with no unlocked achievements', () => {
    const am = new AchievementManager();
    expect(am.unlocked.size).toBe(0);
    expect(am.getProgress().unlocked).toBe(0);
  });

  it('unlock adds achievement', () => {
    const am = new AchievementManager();
    expect(am.unlock('first_block')).toBe(true);
    expect(am.isUnlocked('first_block')).toBe(true);
  });

  it('unlock returns false for already unlocked', () => {
    const am = new AchievementManager();
    am.unlock('first_block');
    expect(am.unlock('first_block')).toBe(false);
  });

  it('unlock returns false for unknown achievement', () => {
    const am = new AchievementManager();
    expect(am.unlock('nonexistent')).toBe(false);
  });

  it('getProgress returns total count', () => {
    const am = new AchievementManager();
    am.unlock('first_block');
    const p = am.getProgress();
    expect(p.unlocked).toBe(1);
    expect(p.total).toBe(Object.keys(ACHIEVEMENTS).length);
  });

  it('getByCategory returns correct achievements', () => {
    const am = new AchievementManager();
    const mining = am.getByCategory('mining');
    expect(mining.length).toBeGreaterThan(0);
    for (const a of mining) {
      expect(a.category).toBe('mining');
    }
  });

  it('update auto-unlocks stat-based achievements', () => {
    const am = new AchievementManager();
    am.stats.blocksBroken = 1;
    am.update(0, {});
    expect(am.isUnlocked('first_block')).toBe(true);
  });

  it('update auto-unlocks mine_100 at 100 blocks', () => {
    const am = new AchievementManager();
    am.stats.blocksBroken = 100;
    am.update(0, {});
    expect(am.isUnlocked('mine_100')).toBe(true);
  });

  it('serialize/deserialize round-trip', () => {
    const am = new AchievementManager();
    am.unlock('first_block');
    am.stats.blocksBroken = 50;
    const data = am.serialize();
    const am2 = new AchievementManager();
    am2.deserialize(data);
    expect(am2.isUnlocked('first_block')).toBe(true);
    expect(am2.stats.blocksBroken).toBe(50);
  });

  it('deserialize handles null stats', () => {
    const am = new AchievementManager();
    am.deserialize({ unlocked: ['first_block'] });
    expect(am.isUnlocked('first_block')).toBe(true);
    expect(am.stats.blocksBroken).toBe(0);
  });
});
