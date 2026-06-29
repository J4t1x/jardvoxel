import { describe, it, expect, beforeEach } from 'vitest';
import {
  ForestCanopyManager,
  FOREST_DENSITY_MULTIPLIER,
  FOREST_PATH_WIDTH,
  CANOPY_SCAN_RANGE,
  shouldGenerateForestPath,
  getForestTreeChance,
  forestCanopyManager,
} from '../core/jardvoxel-survival-forest-canopy.js';

function makeWorld(biome = 'forest', canopyBlocks = 10) {
  return {
    getBiome: () => biome,
    getBlock: (x, y, z) => {
      if (y >= 3 && y <= 10 && canopyBlocks > 0) return 10;
      return 0;
    },
  };
}

function makeDayNight() {
  return { ambientLight: { intensity: 0.5 } };
}

function makeFog() {
  return { fog: { density: 0.05 } };
}

describe('ForestCanopyManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ForestCanopyManager();
  });

  it('should start with zero canopy factor', () => {
    expect(manager.getCanopyFactor()).toBe(0);
    expect(manager.isUnderCanopy()).toBe(false);
  });

  it('should detect canopy from leaf blocks above', () => {
    const world = makeWorld('forest', 10);
    const factor = manager.detectCanopy(world, 0, 0, 0);
    expect(factor).toBeGreaterThan(0);
  });

  it('should return zero canopy in non-forest biome', () => {
    const world = makeWorld('desert', 10);
    manager.update(0.1, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    expect(manager.getCanopyFactor()).toBeLessThan(0.1);
  });

  it('should detect forest biome', () => {
    expect(manager.isInForestBiome('forest')).toBe(true);
    expect(manager.isInForestBiome('jungle')).toBe(true);
    expect(manager.isInForestBiome('taiga')).toBe(true);
    expect(manager.isInForestBiome('swamp')).toBe(true);
    expect(manager.isInForestBiome('autumn_forest')).toBe(true);
    expect(manager.isInForestBiome('mystic_grove')).toBe(true);
  });

  it('should not detect non-forest biome', () => {
    expect(manager.isInForestBiome('plains')).toBe(false);
    expect(manager.isInForestBiome('desert')).toBe(false);
    expect(manager.isInForestBiome('ocean')).toBe(false);
  });

  it('should smooth transition canopy factor', () => {
    const world = makeWorld('forest', 15);
    manager.update(0.016, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    const factor1 = manager.getCanopyFactor();
    manager.update(0.016, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    const factor2 = manager.getCanopyFactor();
    expect(factor2).toBeGreaterThan(factor1);
  });

  it('should reduce ambient light under canopy', () => {
    const world = makeWorld('forest', 15);
    const dayNight = makeDayNight();
    const initialIntensity = dayNight.ambientLight.intensity;
    for (let i = 0; i < 100; i++) {
      manager.update(0.016, world, { x: 0, y: 0, z: 0 }, dayNight, makeFog());
    }
    expect(dayNight.ambientLight.intensity).toBeLessThan(initialIntensity);
  });

  it('should set under canopy flag when factor > 0.3', () => {
    const world = makeWorld('forest', 15);
    for (let i = 0; i < 100; i++) {
      manager.update(0.016, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    }
    expect(manager.isUnderCanopy()).toBe(true);
  });

  it('should return particle count under canopy', () => {
    expect(manager.getParticleCount()).toBe(0);
    const world = makeWorld('forest', 15);
    for (let i = 0; i < 100; i++) {
      manager.update(0.016, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    }
    expect(manager.getParticleCount()).toBe(20);
  });

  it('should export constants', () => {
    expect(FOREST_DENSITY_MULTIPLIER).toBe(1.5);
    expect(FOREST_PATH_WIDTH).toBe(2);
    expect(CANOPY_SCAN_RANGE).toBe(8);
  });

  it('should apply density multiplier to tree chance', () => {
    expect(getForestTreeChance(0.05)).toBeCloseTo(0.075, 5);
  });

  it('should generate forest paths occasionally', () => {
    let pathCount = 0;
    const rng = { next: () => 0.01 };
    for (let x = 2; x < 14; x++) {
      for (let z = 2; z < 14; z++) {
        if (shouldGenerateForestPath(rng, x, z, 16)) pathCount++;
      }
    }
    expect(pathCount).toBeGreaterThan(0);
  });

  it('should not generate paths at chunk edges', () => {
    const rng = { next: () => 0.01 };
    expect(shouldGenerateForestPath(rng, 0, 5, 16)).toBe(false);
    expect(shouldGenerateForestPath(rng, 15, 5, 16)).toBe(false);
    expect(shouldGenerateForestPath(rng, 5, 0, 16)).toBe(false);
    expect(shouldGenerateForestPath(rng, 5, 15, 16)).toBe(false);
  });

  it('should export singleton instance', () => {
    expect(forestCanopyManager).toBeInstanceOf(ForestCanopyManager);
  });

  it('should not crash with null dayNight', () => {
    const world = makeWorld('forest', 10);
    expect(() => manager.update(0.016, world, { x: 0, y: 0, z: 0 }, null, null)).not.toThrow();
  });

  it('should return canopy factor from update', () => {
    const world = makeWorld('forest', 10);
    const factor = manager.update(0.016, world, { x: 0, y: 0, z: 0 }, makeDayNight(), makeFog());
    expect(factor).toBeTypeOf('number');
  });
});
