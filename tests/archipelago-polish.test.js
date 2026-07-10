import { describe, it, expect } from 'vitest';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';
import { WorldIdentity, HierarchicalChunkGenerator } from '../core/jardvoxel-survival-world-hierarchy.js';

function createArchipelagoWorld(seed = 12345) {
  const gen = new HierarchicalChunkGenerator(seed, { archipelagoMode: true });
  return { gen, arch: gen._archipelago, world: gen.world };
}

describe('SPEC-114: Archipelago Performance & Polish', () => {
  describe('GardenIdentity biome bias in chunk context', () => {
    it('chunk context includes garden with biomeBias', () => {
      const { gen, arch } = createArchipelagoWorld();
      const island = arch.islands[0];
      const cx = Math.floor(island.centerX / 32);
      const cz = Math.floor(island.centerZ / 32);
      const context = gen.getChunkContext(cx, cz);
      expect(context.garden).not.toBeNull();
      expect(context.garden.biomeBias).toBeDefined();
      expect(context.garden.biomeBias.common).toBeInstanceOf(Array);
      expect(context.garden.biomeBias.rare).toBeInstanceOf(Array);
      expect(context.garden.biomeBias.signature).toBeTruthy();
    });

    it('biome weights are influenced by garden biomeBias', () => {
      const { gen, arch } = createArchipelagoWorld();
      const island = arch.islands[0];
      const cx = Math.floor(island.centerX / 32);
      const cz = Math.floor(island.centerZ / 32);
      const context = gen.getChunkContext(cx, cz);

      // The common biomes from biomeBias should have non-zero weight
      const commonBiomes = island.biomeBias.common;
      let hasCommonBiome = false;
      for (const biome of commonBiomes) {
        if (context.biomeWeights.has(biome)) {
          hasCommonBiome = true;
          break;
        }
      }
      expect(hasCommonBiome).toBe(true);
    });

    it('signature biome appears in biome weights', () => {
      const { gen, arch } = createArchipelagoWorld();
      const island = arch.islands[0];
      const cx = Math.floor(island.centerX / 32);
      const cz = Math.floor(island.centerZ / 32);
      const context = gen.getChunkContext(cx, cz);

      const sigBiome = island.biomeBias.signature;
      expect(context.biomeWeights.has(sigBiome)).toBe(true);
    });
  });

  describe('Signature landmarks', () => {
    it('every island has a signature landmark', () => {
      const { arch } = createArchipelagoWorld();
      for (const island of arch.islands) {
        expect(island.signatureLandmark).toBeTruthy();
        expect(typeof island.signatureLandmark).toBe('string');
      }
    });

    it('signature landmarks are diverse across islands', () => {
      const { arch } = createArchipelagoWorld();
      const landmarks = new Set(arch.islands.map(i => i.signatureLandmark));
      // At least 2 different landmarks across all islands
      expect(landmarks.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Scene context includes restoration factor', () => {
    it('scene context has restorationFactor in [0.4, 1.0]', () => {
      const { gen, arch } = createArchipelagoWorld();
      const island = arch.islands[0];
      const cx = Math.floor(island.centerX / 32);
      const cz = Math.floor(island.centerZ / 32);
      const context = gen.getChunkContext(cx, cz);
      expect(context.scene).not.toBeNull();
      expect(context.scene.restorationFactor).toBeGreaterThanOrEqual(0.4);
      expect(context.scene.restorationFactor).toBeLessThanOrEqual(1.0);
    });
  });
});
