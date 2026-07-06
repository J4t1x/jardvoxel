import { describe, it, expect } from 'vitest';
import { StreamingManager, STREAMING_TIERS, TIER_DISTANCES } from '../core/jardvoxel-survival-streaming.js';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';
import { WorldIdentity, HierarchicalChunkGenerator } from '../core/jardvoxel-survival-world-hierarchy.js';

function createArchipelagoWorld(seed = 12345) {
  const gen = new HierarchicalChunkGenerator(seed, { archipelagoMode: true });
  return { gen, arch: gen._archipelago, world: gen.world };
}

describe('SPEC-114: Archipelago Performance & Polish', () => {
  describe('StreamingManager LOD bias', () => {
    it('without archipelago, uses standard tier distances', () => {
      const sm = new StreamingManager({}, {});
      const tier = sm.getTierForChunk(5, 5, 0, 0);
      expect(tier).toBe(STREAMING_TIERS.MEDIUM); // dist=5, MEDIUM range 3-8
    });

    it('with archipelago, ocean chunks get HORIZON tier beyond NEAR', () => {
      const universe = new UniverseIdentity(12345);
      const arch = new ArchipelagoGenerator(12345, universe);
      const sm = new StreamingManager({}, {});
      sm.setArchipelago(arch);

      // Find an ocean position far from any island
      const oceanX = 99999;
      const oceanZ = 99999;
      const cx = Math.floor(oceanX / 32);
      const cz = Math.floor(oceanZ / 32);

      // At distance 5 from player (should be MEDIUM in standard, HORIZON in archipelago)
      const tier = sm.getTierForChunk(cx + 5, cz + 5, cx, cz);
      expect(tier).toBe(STREAMING_TIERS.HORIZON);
    });

    it('with archipelago, island chunks get extended NEAR range', () => {
      const universe = new UniverseIdentity(12345);
      const arch = new ArchipelagoGenerator(12345, universe);
      const sm = new StreamingManager({}, {});
      sm.setArchipelago(arch);

      const island = arch.islands[0];
      const cx = Math.floor(island.centerX / 32);
      const cz = Math.floor(island.centerZ / 32);

      // At distance 4 (just beyond standard NEAR=3, but within extended NEAR+2=5)
      const tier = sm.getTierForChunk(cx + 4, cz, cx, cz);
      expect(tier).toBe(STREAMING_TIERS.NEAR);
    });

    it('with archipelago, ocean chunks at NEAR distance stay NEAR', () => {
      const universe = new UniverseIdentity(12345);
      const arch = new ArchipelagoGenerator(12345, universe);
      const sm = new StreamingManager({}, {});
      sm.setArchipelago(arch);

      // Ocean position
      const oceanX = 99999;
      const oceanZ = 99999;
      const cx = Math.floor(oceanX / 32);
      const cz = Math.floor(oceanZ / 32);

      // At distance 2 (within NEAR=3)
      const tier = sm.getTierForChunk(cx + 2, cz, cx, cz);
      expect(tier).toBe(STREAMING_TIERS.NEAR);
    });

    it('setArchipelago(null) disables archipelago mode', () => {
      const universe = new UniverseIdentity(12345);
      const arch = new ArchipelagoGenerator(12345, universe);
      const sm = new StreamingManager({}, {});
      sm.setArchipelago(arch);
      sm.setArchipelago(null);

      const tier = sm.getTierForChunk(5, 5, 0, 0);
      expect(tier).toBe(STREAMING_TIERS.MEDIUM); // Standard behavior
    });
  });

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
