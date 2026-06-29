import { describe, it, expect } from 'vitest';
import {
  SimplexNoise,
  DomainWarper,
  NOISE_CONFIGS,
  TerrainSplines,
  BiomeBlender,
  BiomeTerrainModulator,
  FeaturePlacer,
  HydraulicErosion,
  BIOME_TERRAIN_MODULATION,
  BIOME_TREE_CONFIG,
} from '../core/jardvoxel-survival-noise.js';

// ═══════════════════════════════════════════════════════════
// SPEC-091: SimplexNoise Core
// ═══════════════════════════════════════════════════════════
describe('SimplexNoise', () => {
  it('generates consistent values with same seed', () => {
    const n1 = new SimplexNoise(12345);
    const n2 = new SimplexNoise(12345);
    expect(n1.noise2D(10, 20)).toBe(n2.noise2D(10, 20));
    expect(n1.noise3D(10, 20, 30)).toBe(n2.noise3D(10, 20, 30));
  });

  it('generates different values with different seeds', () => {
    const n1 = new SimplexNoise(12345);
    const n2 = new SimplexNoise(54321);
    expect(n1.noise2D(10.5, 20.3)).not.toBe(n2.noise2D(10.5, 20.3));
  });

  it('noise2D returns values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 1000; i++) {
      const val = noise.noise2D(i * 0.37, i * 0.53);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('noise3D returns values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 1000; i++) {
      const val = noise.noise3D(i * 0.37, i * 0.53, i * 0.71);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('fbm2D returns finite values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 100; i++) {
      const val = noise.fbm2D(i * 1.7, i * 2.3, 4, 0.5, 2.0, 0.01);
      expect(Number.isFinite(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('fbm3D returns finite values in [-1, 1]', () => {
    const noise = new SimplexNoise(12345);
    for (let i = 0; i < 100; i++) {
      const val = noise.fbm3D(i * 1.7, i * 2.3, i * 3.1, 4, 0.5, 2.0, 0.01);
      expect(Number.isFinite(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('permutation table has 512 elements', () => {
    const noise = new SimplexNoise(999);
    expect(noise.perm.length).toBe(512);
    expect(noise.permMod12.length).toBe(512);
  });

  it('noise2D at origin returns 0 (no contribution)', () => {
    const noise = new SimplexNoise(42);
    const val = noise.noise2D(0, 0);
    expect(Math.abs(val)).toBeLessThan(0.01);
  });

  it('noise3D at origin returns 0 (no contribution)', () => {
    const noise = new SimplexNoise(42);
    const val = noise.noise3D(0, 0, 0);
    expect(Math.abs(val)).toBeLessThan(0.01);
  });

  it('produces no NaN values across a grid', () => {
    const noise = new SimplexNoise(7);
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        for (let z = 0; z < 10; z++) {
          expect(Number.isNaN(noise.noise3D(x * 0.1, y * 0.1, z * 0.1))).toBe(false);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-092: Domain Warping
// ═══════════════════════════════════════════════════════════
describe('DomainWarper', () => {
  it('warp2D modifies coordinates', () => {
    const warper = new DomainWarper(12345);
    const warped = warper.warp2D(100, 200);
    expect(warped.x).not.toBe(100);
    expect(warped.z).not.toBe(200);
  });

  it('warp2D is reproducible with same seed', () => {
    const w1 = new DomainWarper(12345);
    const w2 = new DomainWarper(12345);
    const r1 = w1.warp2D(100, 200);
    const r2 = w2.warp2D(100, 200);
    expect(r1.x).toBe(r2.x);
    expect(r1.z).toBe(r2.z);
  });

  it('warp3D does not produce NaN', () => {
    const warper = new DomainWarper(12345);
    for (let i = 0; i < 100; i++) {
      const warped = warper.warp3D(i * 1.7, i * 2.3, i * 3.1);
      expect(Number.isNaN(warped.x)).toBe(false);
      expect(Number.isNaN(warped.y)).toBe(false);
      expect(Number.isNaN(warped.z)).toBe(false);
    }
  });

  it('warp2DRecursive produces different output than warp2D', () => {
    const warper = new DomainWarper(12345);
    const simple = warper.warp2D(100, 200, 50);
    const recursive = warper.warp2DRecursive(100, 200, 50, 25);
    expect(recursive.x).not.toBe(simple.x);
    expect(recursive.z).not.toBe(simple.z);
  });

  it('warp2DDirectional adds directional bias', () => {
    const warper = new DomainWarper(12345);
    const normal = warper.warp2D(100, 200, 50);
    const directional = warper.warp2DDirectional(100, 200, 1, 0, 50);
    expect(directional.x).toBeGreaterThan(normal.x);
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-093: Calibrated Noise Configs
// ═══════════════════════════════════════════════════════════
describe('NOISE_CONFIGS', () => {
  it('has configs for all required noise types', () => {
    expect(NOISE_CONFIGS.continentalness).toBeDefined();
    expect(NOISE_CONFIGS.erosion).toBeDefined();
    expect(NOISE_CONFIGS.peaksValleys).toBeDefined();
    expect(NOISE_CONFIGS.weirdness).toBeDefined();
    expect(NOISE_CONFIGS.temperature).toBeDefined();
    expect(NOISE_CONFIGS.humidity).toBeDefined();
    expect(NOISE_CONFIGS.density3D).toBeDefined();
  });

  it('each config has required fields', () => {
    for (const [name, cfg] of Object.entries(NOISE_CONFIGS)) {
      expect(cfg.octaves).toBeGreaterThan(0);
      expect(cfg.persistence).toBeGreaterThan(0);
      expect(cfg.persistence).toBeLessThanOrEqual(1);
      expect(cfg.lacunarity).toBeGreaterThan(1);
      expect(cfg.scale).toBeGreaterThan(0);
      expect(cfg.warpStrength).toBeGreaterThan(0);
      expect(cfg.warpScale).toBeGreaterThan(0);
      expect(cfg.warpOctaves).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-094: TerrainSplines
// ═══════════════════════════════════════════════════════════
describe('TerrainSplines', () => {
  it('returns finite height for typical values', () => {
    const splines = new TerrainSplines();
    const height = splines.getHeight(0.5, 0.0, 0.3, 0.1);
    expect(Number.isFinite(height)).toBe(true);
  });

  it('ocean continentalness produces lower height', () => {
    const splines = new TerrainSplines();
    const ocean = splines.getHeight(-0.8, 0.0, 0.0, 0.0);
    const land = splines.getHeight(0.5, 0.0, 0.0, 0.0);
    expect(ocean).toBeLessThan(land);
  });

  it('high continentalness produces higher terrain', () => {
    const splines = new TerrainSplines();
    const low = splines.getHeight(0.2, 0.0, 0.0, 0.0);
    const high = splines.getHeight(0.8, 0.0, 0.0, 0.0);
    expect(high).toBeGreaterThan(low);
  });

  it('peaks add height on land', () => {
    const splines = new TerrainSplines();
    const flat = splines.getHeight(0.5, 0.5, 0.0, 0.0);
    const peaked = splines.getHeight(0.5, 0.5, 0.8, 0.0);
    expect(peaked).toBeGreaterThan(flat);
  });

  it('handles extreme values without NaN', () => {
    const splines = new TerrainSplines();
    for (let c = -1; c <= 1; c += 0.2) {
      for (let e = -1; e <= 1; e += 0.2) {
        for (let p = -1; p <= 1; p += 0.2) {
          const h = splines.getHeight(c, e, p, 0);
          expect(Number.isNaN(h)).toBe(false);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-095: BiomeBlender
// ═══════════════════════════════════════════════════════════
describe('BiomeBlender', () => {
  it('returns primary biome when surrounding is uniform', () => {
    const mockWorldGen = {
      getBiome: () => 'plains',
      getSurfaceBlock: (biome) => biome === 'plains' ? 'grass' : 'stone',
    };
    const blender = new BiomeBlender(mockWorldGen);
    const result = blender.getBlendedBiome(0, 0);
    expect(result.primary).toBe('plains');
    expect(result.blend).toBeNull();
  });

  it('returns blend when biomes differ', () => {
    let callCount = 0;
    const biomes = ['plains', 'forest', 'plains', 'forest', 'plains',
                    'forest', 'plains', 'forest', 'plains'];
    const mockWorldGen = {
      getBiome: () => biomes[callCount++ % biomes.length],
      getSurfaceBlock: (biome) => 'grass',
    };
    const blender = new BiomeBlender(mockWorldGen);
    const result = blender.getBlendedBiome(0, 0);
    expect(result.blend).not.toBeNull();
    if (result.blend) {
      const totalWeight = Array.from(result.blend.values()).reduce((a, b) => a + b, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    }
  });

  it('blended color is weighted average', () => {
    const mockWorldGen = {
      getBiome: (x, z) => {
        if (x < 0) return 'ocean';
        return 'plains';
      },
      getSurfaceBlock: () => 'grass',
    };
    const blender = new BiomeBlender(mockWorldGen);
    const color = blender.getBlendedColor(0, 0);
    expect(color.length).toBe(3);
    expect(Number.isFinite(color[0])).toBe(true);
    expect(Number.isFinite(color[1])).toBe(true);
    expect(Number.isFinite(color[2])).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-096: BiomeTerrainModulator
// ═══════════════════════════════════════════════════════════
describe('BiomeTerrainModulator', () => {
  it('modulates base height without NaN', () => {
    const modulator = new BiomeTerrainModulator(12345);
    const result = modulator.modulate(100, 50, 50, 'mountains');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('mountains have larger amplitude than plains', () => {
    const modulator = new BiomeTerrainModulator(12345);
    const plainsVariation = Math.abs(modulator.modulate(100, 50, 50, 'plains') - 100);
    const mountainVariation = Math.abs(modulator.modulate(100, 50, 50, 'mountains') - 100);
    expect(mountainVariation).toBeGreaterThan(plainsVariation);
  });

  it('unknown biome returns base height unchanged', () => {
    const modulator = new BiomeTerrainModulator(12345);
    const result = modulator.modulate(100, 50, 50, 'unknown_biome');
    expect(result).toBe(100);
  });

  it('BIOME_TERRAIN_MODULATION has configs for all biomes', () => {
    expect(BIOME_TERRAIN_MODULATION.plains).toBeDefined();
    expect(BIOME_TERRAIN_MODULATION.mountains).toBeDefined();
    expect(BIOME_TERRAIN_MODULATION.desert).toBeDefined();
    expect(BIOME_TERRAIN_MODULATION.ocean).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-097: FeaturePlacer
// ═══════════════════════════════════════════════════════════
describe('FeaturePlacer', () => {
  it('shouldPlaceTree returns boolean', () => {
    const placer = new FeaturePlacer(12345);
    const result = placer.shouldPlaceTree(10, 20, 'forest');
    expect(typeof result).toBe('boolean');
  });

  it('forest has higher tree density than plains', () => {
    const placer = new FeaturePlacer(12345);
    let forestTrees = 0;
    let plainsTrees = 0;
    for (let x = 0; x < 100; x++) {
      for (let z = 0; z < 100; z++) {
        if (placer.shouldPlaceTree(x, z, 'forest')) forestTrees++;
        if (placer.shouldPlaceTree(x, z, 'plains')) plainsTrees++;
      }
    }
    expect(forestTrees).toBeGreaterThan(plainsTrees);
  });

  it('getTreeType returns a string for configured biomes', () => {
    const placer = new FeaturePlacer(12345);
    const type = placer.getTreeType(10, 20, 'forest');
    expect(typeof type).toBe('string');
  });

  it('getTreeVariation returns size, rotation, and asymmetry', () => {
    const placer = new FeaturePlacer(12345);
    const variation = placer.getTreeVariation(10, 20);
    expect(variation).toHaveProperty('sizeScale');
    expect(variation).toHaveProperty('rotation');
    expect(variation).toHaveProperty('asymmetry');
    expect(variation.sizeScale).toBeGreaterThan(0);
  });

  it('BIOME_TREE_CONFIG has configs for forest and plains', () => {
    expect(BIOME_TREE_CONFIG.forest).toBeDefined();
    expect(BIOME_TREE_CONFIG.plains).toBeDefined();
    expect(BIOME_TREE_CONFIG.forest.density).toBeGreaterThan(BIOME_TREE_CONFIG.plains.density);
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-098: HydraulicErosion
// ═══════════════════════════════════════════════════════════
describe('HydraulicErosion', () => {
  it('erodes a heightmap without NaN', () => {
    const erosion = new HydraulicErosion(12345);
    const heightmap = [];
    for (let x = 0; x < 10; x++) {
      heightmap[x] = [];
      for (let z = 0; z < 10; z++) {
        heightmap[x][z] = 50 + Math.sin(x * 0.5) * 10 + Math.cos(z * 0.5) * 10;
      }
    }
    const result = erosion.erode(heightmap, 2);
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        expect(Number.isFinite(result[x][z])).toBe(true);
      }
    }
  });

  it('reduces extreme height differences', () => {
    const erosion = new HydraulicErosion(12345);
    const heightmap = [];
    for (let x = 0; x < 10; x++) {
      heightmap[x] = [];
      for (let z = 0; z < 10; z++) {
        heightmap[x][z] = 50 + Math.sin(x * 0.5) * 20 + Math.cos(z * 0.5) * 20;
      }
    }
    const beforeRange = Math.max(...heightmap.flat()) - Math.min(...heightmap.flat());
    const result = erosion.erode(heightmap, 5);
    const afterRange = Math.max(...result.flat()) - Math.min(...result.flat());
    expect(afterRange).toBeLessThanOrEqual(beforeRange);
  });
});
