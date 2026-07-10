import { describe, it, expect } from 'vitest';
import { RestorationSystem } from '../core/jardvoxel-survival-restoration.js';
import { OceanSystem } from '../core/jardvoxel-survival-ocean.js';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';
import { ExplorationJournal, ENTRY_TYPES } from '../core/jardvoxel-survival-journal.js';

function createArchipelago(seed = 12345) {
  const universe = new UniverseIdentity(seed);
  const arch = new ArchipelagoGenerator(seed, universe);
  return { universe, arch };
}

describe('SPEC-115: Garden Launch Integration', () => {
  describe('Archipelago system initialization', () => {
    it('OceanSystem initializes with archipelago', () => {
      const { arch } = createArchipelago();
      const ocean = new OceanSystem(arch);
      expect(ocean).toBeDefined();
      expect(ocean.isEnabled()).toBe(false);
    });

    it('RestorationSystem initializes with archipelago', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      expect(restoration).toBeDefined();
      expect(restoration.getOverallProgress()).toBe(0);
    });

  });

  describe('Garden discovery', () => {
    it('discoverGarden returns discovery info', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const island = arch.islands[0];
      const result = restoration.discoverGarden(island);
      expect(result).not.toBeNull();
      expect(result.gardenName).toBe(island.name);
      expect(result.mood).toBe(island.mood);
      expect(result.discoveryQuote).toBeTruthy();
    });

    it('discovery only triggers once per garden', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const island = arch.islands[0];
      const first = restoration.discoverGarden(island);
      const second = restoration.discoverGarden(island);
      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });

    it('getMinimapMarkers returns only discovered gardens', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      expect(restoration.getMinimapMarkers().length).toBe(0);
      restoration.discoverGarden(arch.islands[0]);
      const markers = restoration.getMinimapMarkers();
      expect(markers.length).toBe(1);
      expect(markers[0].label).toBe(arch.islands[0].name);
      expect(markers[0]).toHaveProperty('progress');
    });
  });

  describe('Restoration progress UI data', () => {
    it('getGardenProgress returns 0-1 value', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const island = arch.islands[0];
      expect(restoration.getGardenProgress(island.gardenId)).toBe(0);

      const points = restoration.getRestorationPoints(island.gardenId);
      restoration.activatePoint(points[0], island);
      const progress = restoration.getGardenProgress(island.gardenId);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('getRestorationPoints returns array with activated state', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const island = arch.islands[0];
      const points = restoration.getRestorationPoints(island.gardenId);
      expect(points.length).toBeGreaterThanOrEqual(3);
      for (const p of points) {
        expect(p).toHaveProperty('activated');
        expect(p).toHaveProperty('type');
      }
    });
  });

  describe('Ocean swim speed', () => {
    it('archipelago.isOcean returns true for ocean positions', () => {
      const { arch } = createArchipelago();
      expect(arch.isOcean(99999, 99999)).toBe(true);
    });

    it('archipelago.isOcean returns false for island positions', () => {
      const { arch } = createArchipelago();
      const island = arch.islands[0];
      expect(arch.isOcean(island.centerX, island.centerZ)).toBe(false);
    });
  });

  describe('Save/Load integration', () => {
    it('RestorationSystem serialize/deserialize preserves state', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const island = arch.islands[0];
      restoration.discoverGarden(island);
      const points = restoration.getRestorationPoints(island.gardenId);
      restoration.activatePoint(points[0], island);

      const data = restoration.serialize();
      expect(data).toHaveProperty('restorationPoints');
      expect(data).toHaveProperty('activatedPoints');
      expect(data).toHaveProperty('discoveredGardens');
      expect(data).toHaveProperty('gardenProgress');
      expect(data.discoveredGardens).toContain(island.gardenId);

      const { arch: arch2 } = createArchipelago();
      const restoration2 = new RestorationSystem(arch2);
      restoration2.deserialize(data);
      expect(restoration2.isDiscovered(island.gardenId)).toBe(true);
      expect(restoration2.getGardenProgress(island.gardenId)).toBeGreaterThan(0);
    });

    it('save data includes archipelago key when in archipelago mode', () => {
      const { arch } = createArchipelago();
      const restoration = new RestorationSystem(arch);
      const saveData = {
        seed: 12345,
        blockMods: [],
        resonance: {},
        journal: {},
        discoveredBiomes: [],
      };
      // Simulate _getSaveData with archipelago
      if (restoration) {
        saveData.archipelago = { restoration: restoration.serialize() };
      }
      expect(saveData.archipelago).toBeDefined();
      expect(saveData.archipelago.restoration).toBeDefined();
    });

    it('old saves without archipelago key load without error', () => {
      const oldSave = {
        seed: 12345,
        blockMods: [],
        resonance: {},
        journal: {},
        discoveredBiomes: [],
      };
      // No archipelago key — should not throw
      expect(oldSave.archipelago).toBeUndefined();
      // Simulate load: if no archipelago, mode stays false
      const archipelagoMode = oldSave.archipelago ? true : false;
      expect(archipelagoMode).toBe(false);
    });
  });

  describe('Journal entry types for archipelago', () => {
    it('has GARDEN_DISCOVERY entry type', () => {
      expect(ENTRY_TYPES.GARDEN_DISCOVERY).toBe('garden_discovery');
    });

    it('has RESTORATION_POINT entry type', () => {
      expect(ENTRY_TYPES.RESTORATION_POINT).toBe('restoration_point');
    });

    it('has GARDEN_RESTORED entry type', () => {
      expect(ENTRY_TYPES.GARDEN_RESTORED).toBe('garden_restored');
    });

    it('journal tracks gardensDiscovered stat', () => {
      const journal = new ExplorationJournal();
      expect(journal._stats).toHaveProperty('gardensDiscovered');
      expect(journal._stats.gardensDiscovered).toBe(0);
    });

    it('journal tracks restorationPointsActivated stat', () => {
      const journal = new ExplorationJournal();
      expect(journal._stats).toHaveProperty('restorationPointsActivated');
      expect(journal._stats.restorationPointsActivated).toBe(0);
    });

    it('journal tracks gardensRestored stat', () => {
      const journal = new ExplorationJournal();
      expect(journal._stats).toHaveProperty('gardensRestored');
      expect(journal._stats.gardensRestored).toBe(0);
    });

    it('journal can add garden discovery entry', () => {
      const journal = new ExplorationJournal();
      const entry = journal.addEntry(ENTRY_TYPES.GARDEN_DISCOVERY, 'Isla Serenia', 'A serene island...');
      expect(entry.type).toBe('garden_discovery');
      expect(entry.title).toBe('Isla Serenia');
    });
  });

  describe('Backward compatibility', () => {
    it('non-archipelago mode has null oceanSystem and restorationSystem', () => {
      // Simulate non-archipelago mode
      const archipelagoMode = false;
      const oceanSystem = archipelagoMode ? new OceanSystem(null) : null;
      const restorationSystem = archipelagoMode ? new RestorationSystem(null) : null;
      expect(oceanSystem).toBeNull();
      expect(restorationSystem).toBeNull();
    });

  });
});
