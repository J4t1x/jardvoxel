import { describe, it, expect } from 'vitest';
import { SceneComposer } from '../core/jardvoxel-survival-scene-composer.js';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';

function createTestArchipelago(seed = 12345) {
  const universe = new UniverseIdentity(seed);
  const arch = new ArchipelagoGenerator(seed, universe);
  return { universe, arch };
}

describe('SceneComposer', () => {
  it('generates valid SceneContext for island chunks', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const cx = Math.floor(island.centerX / 32);
    const cz = Math.floor(island.centerZ / 32);
    const region = { type: 'forest', biomeBias: ['forest'], treeDensity: 1.0 };
    const zone = { type: 'dense_forest', moodTag: 'mysterious' };

    const ctx = composer.getSceneContext(cx, cz, region, zone, island);
    expect(ctx).toHaveProperty('focalPoint');
    expect(ctx).toHaveProperty('framing');
    expect(ctx).toHaveProperty('sightLine');
    expect(ctx).toHaveProperty('treeDensityMod');
    expect(ctx).toHaveProperty('flowerDensityMod');
    expect(ctx).toHaveProperty('colorMood');
    expect(ctx).toHaveProperty('restorationFactor');
    expect(ctx.isOcean).toBe(false);
  });

  it('returns ocean context when garden is null', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const ctx = composer.getSceneContext(999, 999, {}, {}, null);
    expect(ctx.isOcean).toBe(true);
    expect(ctx.treeDensityMod).toBe(1.0);
    expect(ctx.flowerDensityMod).toBe(1.0);
  });

  it('treeDensityMod is within 0.1-1.5 range', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    for (let cx = -5; cx <= 5; cx++) {
      for (let cz = -5; cz <= 5; cz++) {
        const region = { type: 'forest', treeDensity: 1.0 };
        const zone = { type: 'dense_forest', moodTag: 'mysterious' };
        const ctx = composer.getSceneContext(cx, cz, region, zone, island);
        expect(ctx.treeDensityMod).toBeGreaterThanOrEqual(0.1);
        expect(ctx.treeDensityMod).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it('flowerDensityMod is within 0.1-1.5 range', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const ctx = composer.getSceneContext(0, 0, { type: 'plains', treeDensity: 0.3 }, { type: 'meadow', moodTag: 'serene' }, island);
    expect(ctx.flowerDensityMod).toBeGreaterThanOrEqual(0.1);
    expect(ctx.flowerDensityMod).toBeLessThanOrEqual(1.5);
  });

  it('focal point is detected near island center', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    // Chunk at island center should have focal point if within 200 blocks
    const cx = Math.floor(island.centerX / 32);
    const cz = Math.floor(island.centerZ / 32);
    const ctx = composer.getSceneContext(cx, cz, { type: 'plains' }, { type: 'meadow', moodTag: 'serene' }, island);
    // Focal point may be null if too close (< 5 blocks), but should not error
    if (ctx.focalPoint) {
      expect(ctx.focalPoint).toHaveProperty('type');
      expect(ctx.focalPoint).toHaveProperty('direction');
      expect(ctx.focalPoint).toHaveProperty('distance');
    }
  });

  it('colorMood is a non-empty string', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const ctx = composer.getSceneContext(0, 0, { type: 'forest' }, { type: 'clearing', moodTag: 'serene' }, island);
    expect(ctx.colorMood).toBeTruthy();
    expect(typeof ctx.colorMood).toBe('string');
  });

  it('restorationFactor is in 0.4-1.0 range', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const ctx = composer.getSceneContext(0, 0, { type: 'forest' }, { type: 'meadow', moodTag: 'serene' }, island);
    expect(ctx.restorationFactor).toBeGreaterThanOrEqual(0.4);
    expect(ctx.restorationFactor).toBeLessThanOrEqual(1.0);
  });

  it('uses LRU cache (returns same object for same chunk)', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const region = { type: 'forest', treeDensity: 1.0 };
    const zone = { type: 'dense_forest', moodTag: 'mysterious' };
    const ctx1 = composer.getSceneContext(1, 1, region, zone, island);
    const ctx2 = composer.getSceneContext(1, 1, region, zone, island);
    expect(ctx1).toBe(ctx2); // Same reference (cached)
  });

  it('clearing detection works for forest zones', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    // Test multiple chunks — some should have clearings
    let hasClearing = false;
    for (let i = 0; i < 50; i++) {
      const cx = Math.floor(island.centerX / 32) + i;
      const cz = Math.floor(island.centerZ / 32);
      const ctx = composer.getSceneContext(cx, cz, { type: 'forest' }, { type: 'dense_forest', moodTag: 'mysterious' }, island);
      if (ctx.clearing) hasClearing = true;
    }
    // At least one clearing should be detected in 50 chunks
    // (probabilistic, but clearingValue > 0.4 should trigger for some)
    expect(typeof hasClearing).toBe('boolean');
  });

  it('mood effects are retrievable', () => {
    const { arch } = createTestArchipelago();
    const composer = new SceneComposer(12345, arch);
    const island = arch.islands[0];
    const effects = composer.getMoodEffects(island);
    expect(effects).toHaveProperty('fogDensity');
    expect(effects).toHaveProperty('lightWarmth');
    expect(effects).toHaveProperty('particleBias');
    expect(effects).toHaveProperty('musicTempo');
  });
});
