import { describe, it, expect } from 'vitest';
import {
  BIOME_FINGERPRINTS,
  BiomeIdentityManager,
  biomeIdentityManager,
  TREE_SHAPES,
  VEGETATION_DENSITY,
  ROCK_TYPES,
  AMBIENT_SOUNDS,
  MUSIC_MOODS,
  BIOME_PARTICLES,
} from '../core/jardvoxel-survival-biome-identity.js';
import { BIOMES } from '../core/jardvoxel-survival-engine.js';

describe('BiomeIdentityManager', () => {
  const manager = new BiomeIdentityManager();

  it('should have fingerprints for all 19 biomes', () => {
    const biomeCount = Object.keys(BIOME_FINGERPRINTS).length;
    expect(biomeCount).toBe(19);
  });

  it('should have fingerprints for all BIOMES constants', () => {
    for (const key of Object.keys(BIOMES)) {
      const biome = BIOMES[key];
      expect(manager.hasFingerprint(biome)).toBe(true);
    }
  });

  it('should have Mystic Grove fingerprint with mushroom trees', () => {
    const fp = manager.getFingerprint(BIOMES.MYSTIC_GROVE);
    expect(fp.treeShape).toBe(TREE_SHAPES.MYSTIC_MUSHROOM);
    expect(fp.musicMood).toBe(MUSIC_MOODS.MAGICAL);
    expect(fp.particles).toBe(BIOME_PARTICLES.SPORES);
    expect(fp.ambientSound).toBe(AMBIENT_SOUNDS.MYSTIC_HUM);
  });

  it('should have Autumn Forest fingerprint with autumn oak trees', () => {
    const fp = manager.getFingerprint(BIOMES.AUTUMN_FOREST);
    expect(fp.treeShape).toBe(TREE_SHAPES.AUTUMN_OAK);
    expect(fp.musicMood).toBe(MUSIC_MOODS.MELANCHOLIC);
    expect(fp.particles).toBe(BIOME_PARTICLES.FALLING_LEAVES);
    expect(fp.ambientSound).toBe(AMBIENT_SOUNDS.LEAVES_RUSTLING);
  });

  it('should return valid fingerprint for each biome', () => {
    for (const biome of Object.keys(BIOME_FINGERPRINTS)) {
      const fp = manager.getFingerprint(biome);
      expect(fp.treeShape).toBeDefined();
      expect(fp.vegetationDensity).toBeDefined();
      expect(fp.rockType).toBeDefined();
      expect(fp.temperature).toBeTypeOf('number');
      expect(fp.humidity).toBeTypeOf('number');
      expect(fp.ambientSound).toBeDefined();
      expect(fp.musicMood).toBeDefined();
      expect(fp.particles).toBeDefined();
      expect(fp.fauna).toBeDefined();
      expect(fp.fauna.passive).toBeInstanceOf(Array);
      expect(fp.fauna.hostile).toBeInstanceOf(Array);
    }
  });

  it('should return plains as fallback for unknown biome', () => {
    const fp = manager.getFingerprint('nonexistent_biome');
    expect(fp.treeShape).toBe(TREE_SHAPES.OAK_ROUND);
  });

  it('should create transition fingerprint between two biomes', () => {
    const transition = manager.getTransitionFingerprint(BIOMES.FOREST, BIOMES.DESERT, 0.5);
    expect(transition).toBeDefined();
    expect(transition.transitionFrom).toBe(BIOMES.FOREST);
    expect(transition.transitionTo).toBe(BIOMES.DESERT);
    expect(transition.blendFactor).toBe(0.5);
  });

  it('should interpolate temperature in transition', () => {
    const fpA = manager.getFingerprint(BIOMES.FOREST);
    const fpB = manager.getFingerprint(BIOMES.DESERT);
    const transition = manager.getTransitionFingerprint(BIOMES.FOREST, BIOMES.DESERT, 0.5);
    const expectedTemp = (fpA.temperature + fpB.temperature) / 2;
    expect(transition.temperature).toBeCloseTo(expectedTemp, 2);
  });

  it('should interpolate humidity in transition', () => {
    const fpA = manager.getFingerprint(BIOMES.FOREST);
    const fpB = manager.getFingerprint(BIOMES.DESERT);
    const transition = manager.getTransitionFingerprint(BIOMES.FOREST, BIOMES.DESERT, 0.5);
    const expectedHumid = (fpA.humidity + fpB.humidity) / 2;
    expect(transition.humidity).toBeCloseTo(expectedHumid, 2);
  });

  it('should use biome A properties when blend < 0.5', () => {
    const transition = manager.getTransitionFingerprint(BIOMES.FOREST, BIOMES.DESERT, 0.3);
    const fpA = manager.getFingerprint(BIOMES.FOREST);
    expect(transition.treeShape).toBe(fpA.treeShape);
    expect(transition.ambientSound).toBe(fpA.ambientSound);
  });

  it('should use biome B properties when blend > 0.5', () => {
    const transition = manager.getTransitionFingerprint(BIOMES.FOREST, BIOMES.DESERT, 0.7);
    const fpB = manager.getFingerprint(BIOMES.DESERT);
    expect(transition.treeShape).toBe(fpB.treeShape);
    expect(transition.ambientSound).toBe(fpB.ambientSound);
  });

  it('should get tree shape for biome', () => {
    expect(manager.getTreeShape(BIOMES.TAIGA)).toBe(TREE_SHAPES.PINE_CONICAL);
    expect(manager.getTreeShape(BIOMES.JUNGLE)).toBe(TREE_SHAPES.MANGROVE_ROOTS);
    expect(manager.getTreeShape(BIOMES.SAVANNA)).toBe(TREE_SHAPES.ACACIA_FLAT);
    expect(manager.getTreeShape(BIOMES.CHERRY_GROVE)).toBe(TREE_SHAPES.CHERRY_SPHERE);
  });

  it('should get vegetation density for biome', () => {
    expect(manager.getVegetationDensity(BIOMES.JUNGLE)).toBe(VEGETATION_DENSITY.VERY_DENSE);
    expect(manager.getVegetationDensity(BIOMES.DESERT)).toBe(VEGETATION_DENSITY.SPARSE);
    expect(manager.getVegetationDensity(BIOMES.FOREST)).toBe(VEGETATION_DENSITY.DENSE);
  });

  it('should get tree chance based on vegetation density', () => {
    expect(manager.getTreeChance(BIOMES.JUNGLE)).toBe(0.12);
    expect(manager.getTreeChance(BIOMES.FOREST)).toBe(0.08);
    expect(manager.getTreeChance(BIOMES.PLAINS)).toBe(0.02);
  });

  it('should get particle type for biome', () => {
    expect(manager.getParticleType(BIOMES.SNOWY_PLAINS)).toBe(BIOME_PARTICLES.SNOWFLAKES);
    expect(manager.getParticleType(BIOMES.SWAMP)).toBe(BIOME_PARTICLES.FIREFLIES);
    expect(manager.getParticleType(BIOMES.MYSTIC_GROVE)).toBe(BIOME_PARTICLES.SPORES);
    expect(manager.getParticleType(BIOMES.AUTUMN_FOREST)).toBe(BIOME_PARTICLES.FALLING_LEAVES);
  });

  it('should get music mood for biome', () => {
    expect(manager.getMusicMood(BIOMES.MYSTIC_GROVE)).toBe(MUSIC_MOODS.MAGICAL);
    expect(manager.getMusicMood(BIOMES.AUTUMN_FOREST)).toBe(MUSIC_MOODS.MELANCHOLIC);
    expect(manager.getMusicMood(BIOMES.MOUNTAINS)).toBe(MUSIC_MOODS.EPIC);
  });

  it('should get ambient sound for biome', () => {
    expect(manager.getAmbientSound(BIOMES.PLAINS)).toBe(AMBIENT_SOUNDS.BIRDS);
    expect(manager.getAmbientSound(BIOMES.DESERT)).toBe(AMBIENT_SOUNDS.WIND);
    expect(manager.getAmbientSound(BIOMES.SWAMP)).toBe(AMBIENT_SOUNDS.INSECTS);
  });

  it('should get biome transition from world', () => {
    const world = {
      getBiome: (x, z) => {
        if (x > 100) return BIOMES.DESERT;
        return BIOMES.FOREST;
      },
    };
    const transition = manager.getBiomeTransition(world, 95, 0, 8);
    expect(transition).toBeDefined();
  });

  it('should return same biome fingerprint when no transition', () => {
    const world = {
      getBiome: () => BIOMES.FOREST,
    };
    const result = manager.getBiomeTransition(world, 0, 0, 8);
    expect(result.treeShape).toBe(manager.getFingerprint(BIOMES.FOREST).treeShape);
  });

  it('should list all biomes', () => {
    const all = manager.getAllBiomes();
    expect(all.length).toBe(19);
    expect(all).toContain('mystic_grove');
    expect(all).toContain('autumn_forest');
  });

  it('should export singleton instance', () => {
    expect(biomeIdentityManager).toBeInstanceOf(BiomeIdentityManager);
  });

  it('should have distinct tree shapes across biomes', () => {
    const shapes = new Set();
    for (const biome of Object.keys(BIOME_FINGERPRINTS)) {
      shapes.add(manager.getTreeShape(biome));
    }
    expect(shapes.size).toBeGreaterThan(4);
  });

  it('should have all tree shape constants', () => {
    expect(TREE_SHAPES.OAK_ROUND).toBe('oak_round');
    expect(TREE_SHAPES.PINE_CONICAL).toBe('pine_conical');
    expect(TREE_SHAPES.MYSTIC_MUSHROOM).toBe('mystic_mushroom');
    expect(TREE_SHAPES.AUTUMN_OAK).toBe('autumn_oak');
    expect(TREE_SHAPES.ACACIA_FLAT).toBe('acacia_flat');
    expect(TREE_SHAPES.CHERRY_SPHERE).toBe('cherry_sphere');
  });
});
