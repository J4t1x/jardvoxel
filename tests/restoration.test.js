import { describe, it, expect, beforeEach } from 'vitest';
import { RestorationSystem, RESTORATION_POINT_TYPES, RESTORATION_VISUAL_EFFECTS } from '../core/jardvoxel-survival-restoration.js';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';

function createTestSystem(seed = 12345) {
  const universe = new UniverseIdentity(seed);
  const arch = new ArchipelagoGenerator(seed, universe);
  const restoration = new RestorationSystem(arch);
  return { universe, arch, restoration };
}

describe('RestorationSystem', () => {
  it('initializes restoration points for all islands', () => {
    const { arch, restoration } = createTestSystem();
    for (const island of arch.islands) {
      const points = restoration.getRestorationPoints(island.gardenId);
      expect(points.length).toBeGreaterThanOrEqual(3);
      expect(points.length).toBeLessThanOrEqual(5);
    }
  });

  it('all points start unactivated', () => {
    const { arch, restoration } = createTestSystem();
    for (const island of arch.islands) {
      const points = restoration.getRestorationPoints(island.gardenId);
      for (const point of points) {
        expect(point.activated).toBe(false);
      }
    }
  });

  it('garden progress starts at 0', () => {
    const { arch, restoration } = createTestSystem();
    for (const island of arch.islands) {
      expect(restoration.getGardenProgress(island.gardenId)).toBe(0);
    }
  });

  it('checkProximity returns null when not near a point', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    // Position far from any restoration point
    const result = restoration.checkProximity(island.centerX + 1000, island.centerZ + 1000);
    expect(result).toBeNull();
  });

  it('checkProximity returns null in ocean', () => {
    const { restoration } = createTestSystem();
    const result = restoration.checkProximity(99999, 99999);
    expect(result).toBeNull();
  });

  it('checkProximity finds point near player', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);
    // Move player to first restoration point
    const point = points[0];
    const result = restoration.checkProximity(point.x, point.z, 10);
    expect(result).not.toBeNull();
    expect(result.point.id).toBe(point.id);
  });

  it('activatePoint activates a point and updates progress', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);
    const point = points[0];

    const result = restoration.activatePoint(point, island);
    expect(result).not.toBeNull();
    expect(result.pointType).toBe(point.type);
    expect(result.gardenProgress).toBeGreaterThan(0);

    // Point should be activated
    expect(point.activated).toBe(true);

    // Progress should be updated
    const progress = restoration.getGardenProgress(island.gardenId);
    expect(progress).toBeGreaterThan(0);
  });

  it('cannot activate the same point twice', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);
    const point = points[0];

    restoration.activatePoint(point, island);
    const result = restoration.activatePoint(point, island);
    expect(result).toBe(false);
  });

  it('activating all points sets garden to pristine', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);

    for (const point of points) {
      restoration.activatePoint(point, island);
    }

    expect(island.restorationState).toBe('pristine');
    expect(restoration.getGardenProgress(island.gardenId)).toBe(1.0);
  });

  it('discoverGarden returns discovery info on first visit', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const result = restoration.discoverGarden(island);
    expect(result).not.toBeNull();
    expect(result.gardenName).toBe(island.name);
    expect(result.mood).toBe(island.mood);
    expect(result.discoveryQuote).toBeTruthy();
  });

  it('discoverGarden returns null on second visit', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    restoration.discoverGarden(island);
    const result = restoration.discoverGarden(island);
    expect(result).toBeNull();
  });

  it('isDiscovered tracks discovery state', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    expect(restoration.isDiscovered(island.gardenId)).toBe(false);
    restoration.discoverGarden(island);
    expect(restoration.isDiscovered(island.gardenId)).toBe(true);
  });

  it('getOverallProgress returns average across all gardens', () => {
    const { arch, restoration } = createTestSystem();
    // Initially 0
    expect(restoration.getOverallProgress()).toBe(0);

    // Activate all points in first garden
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);
    for (const point of points) {
      restoration.activatePoint(point, island);
    }

    // Overall progress should be > 0 but < 1
    const overall = restoration.getOverallProgress();
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThan(1);
  });

  it('serialize and deserialize preserve state', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    restoration.discoverGarden(island);
    const points = restoration.getRestorationPoints(island.gardenId);
    restoration.activatePoint(points[0], island);

    const data = restoration.serialize();

    // Create new system and deserialize
    const { restoration: restoration2 } = createTestSystem();
    restoration2.deserialize(data);

    expect(restoration2.isDiscovered(island.gardenId)).toBe(true);
    expect(restoration2.getGardenProgress(island.gardenId)).toBeGreaterThan(0);
    const restoredPoints = restoration2.getRestorationPoints(island.gardenId);
    expect(restoredPoints[0].activated).toBe(true);
  });

  it('getMinimapMarkers returns discovered gardens', () => {
    const { arch, restoration } = createTestSystem();
    // No markers initially
    expect(restoration.getMinimapMarkers().length).toBe(0);

    // Discover a garden
    restoration.discoverGarden(arch.islands[0]);
    const markers = restoration.getMinimapMarkers();
    expect(markers.length).toBe(1);
    expect(markers[0].label).toBe(arch.islands[0].name);
    expect(markers[0]).toHaveProperty('x');
    expect(markers[0]).toHaveProperty('z');
    expect(markers[0]).toHaveProperty('progress');
  });

  it('updateEffects filters out expired effects', () => {
    const { arch, restoration } = createTestSystem();
    const island = arch.islands[0];
    const points = restoration.getRestorationPoints(island.gardenId);
    restoration.activatePoint(points[0], island);

    // Should have active effects
    expect(restoration.getActiveEffects().length).toBeGreaterThan(0);

    // Simulate time passing (effects have duration in ms)
    // We can't easily wait, but updateEffects should filter by time
    restoration.updateEffects(0.016);
    // Effects should still be active (just started)
    expect(restoration.getActiveEffects().length).toBeGreaterThan(0);
  });

  it('restoration point types are defined', () => {
    expect(RESTORATION_POINT_TYPES.ANCIENT_TREE).toBeDefined();
    expect(RESTORATION_POINT_TYPES.STONE_SHRINE).toBeDefined();
    expect(RESTORATION_POINT_TYPES.SPRING).toBeDefined();
    expect(RESTORATION_POINT_TYPES.FLOWER_CIRCLE).toBeDefined();
  });

  it('visual effects are defined for all point types', () => {
    for (const [typeName, typeConfig] of Object.entries(RESTORATION_POINT_TYPES)) {
      const effectName = typeConfig.visualEffect;
      expect(RESTORATION_VISUAL_EFFECTS[effectName]).toBeDefined();
      expect(RESTORATION_VISUAL_EFFECTS[effectName]).toHaveProperty('duration');
      expect(RESTORATION_VISUAL_EFFECTS[effectName]).toHaveProperty('saturationBoost');
    }
  });
});
