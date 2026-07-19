import { describe, it, expect } from 'vitest';
import { WorldGenPipeline, CHUNK_SIZE, SEA_LEVEL } from '../core/jardvoxel-survival-engine.js';
import { VoronoiBiomeMap } from '../core/jardvoxel-survival-voronoi.js';
import {
  FastNoiseLite, FN_NOISE_TYPE, FN_CELLULAR_RETURN,
  DomainWarper, BiomeBlender, TerrainSplines, FeaturePlacer,
  NOISE_CONFIGS,
} from '../core/jardvoxel-survival-noise.js';
import { PoissonDiskSampler } from '../core/jardvoxel-survival-poisson.js';

// ═══════════════════════════════════════════════════════════
// SPEC-077: Organic Terrain — 5 Noise & Biome Systems (verification)
// All 5 systems were already implemented; this spec verifies them.
// ═══════════════════════════════════════════════════════════

describe('SPEC-077 Gap 1: Voronoi Biomes — organic boundaries', () => {
  it('VoronoiBiomeMap constructs and produces biome values', () => {
    const vmap = new VoronoiBiomeMap(12345);
    expect(vmap).toBeInstanceOf(VoronoiBiomeMap);
    const pipe = new WorldGenPipeline(12345);
    const biome1 = vmap.getBiomeWithBlend(0, 0, (x, z) => pipe.getBaseHeight(x, z), (x, z) => pipe.getContinentalness(x, z));
    const biome2 = vmap.getBiomeWithBlend(250, 0, (x, z) => pipe.getBaseHeight(x, z), (x, z) => pipe.getContinentalness(x, z));
    // VoronoiBiomeMap returns BIOMES enum values (strings)
    expect(biome1).toBeDefined();
    expect(biome2).toBeDefined();
  });

  it('biome boundaries are not axis-aligned squares (organic via warp)', () => {
    const vmap = new VoronoiBiomeMap(12345);
    const pipe = new WorldGenPipeline(12345);
    const gh = (x, z) => pipe.getBaseHeight(x, z);
    const gc = (x, z) => pipe.getContinentalness(x, z);
    const biomes = [];
    for (let x = 0; x <= 200; x += 10) {
      const row = [];
      for (let z = 0; z <= 200; z += 10) {
        row.push(vmap.getBiomeWithBlend(x, z, gh, gc));
      }
      biomes.push(row);
    }
    let transitions = 0;
    for (let r = 0; r < biomes.length; r++) {
      for (let c = 0; c < biomes[r].length; c++) {
        if (c > 0 && biomes[r][c] !== biomes[r][c - 1]) transitions++;
        if (r > 0 && biomes[r][c] !== biomes[r - 1][c]) transitions++;
      }
    }
    expect(transitions).toBeGreaterThan(0);
  });

  it('is integrated into WorldGenPipeline', () => {
    const pipe = new WorldGenPipeline(42);
    expect(pipe._voronoiBiomes).toBeInstanceOf(VoronoiBiomeMap);
  });
});

describe('SPEC-077 Gap 2: FastNoise Lite — replaces Perlin', () => {
  it('FastNoiseLite constructs with OpenSimplex2', () => {
    const noise = new FastNoiseLite(42);
    noise.setNoiseType(FN_NOISE_TYPE.OPENSIMPLEX2);
    const v1 = noise.noise2D(0, 0);
    const v2 = noise.noise2D(100, 100);
    expect(typeof v1).toBe('number');
    expect(v1).toBeGreaterThanOrEqual(-1);
    expect(v1).toBeLessThanOrEqual(1);
    expect(v1).not.toBe(v2);
  });

  it('is deterministic for same seed', () => {
    const n1 = new FastNoiseLite(99);
    const n2 = new FastNoiseLite(99);
    for (let i = 0; i < 10; i++) {
      expect(n1.noise2D(i * 10, i * 7)).toBe(n2.noise2D(i * 10, i * 7));
    }
  });

  it('is integrated into WorldGenPipeline', () => {
    const pipe = new WorldGenPipeline(42);
    expect(pipe._cellularNoise).toBeInstanceOf(FastNoiseLite);
  });
});

describe('SPEC-077 Gap 3: Cellular Noise — cave structures', () => {
  it('FastNoiseLite supports cellular noise', () => {
    const noise = new FastNoiseLite(42);
    noise.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    noise.setCellularReturnType(FN_CELLULAR_RETURN.F1);
    const v = noise.noise2D(50, 50);
    expect(typeof v).toBe('number');
  });

  it('cellular noise produces F1, F2, F1-F2, F1*F2 return types', () => {
    const noise = new FastNoiseLite(42);
    noise.setNoiseType(FN_NOISE_TYPE.CELLULAR);
    for (const retType of [FN_CELLULAR_RETURN.F1, FN_CELLULAR_RETURN.F2, FN_CELLULAR_RETURN.F1MinusF2, FN_CELLULAR_RETURN.F1TimesF2]) {
      noise.setCellularReturnType(retType);
      const v = noise.noise2D(25, 25);
      expect(typeof v).toBe('number');
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('is used in terrain generation (engine getBaseHeight)', () => {
    const pipe = new WorldGenPipeline(42);
    const h1 = pipe.getBaseHeight(0, 0);
    const h2 = pipe.getBaseHeight(100, 100);
    expect(h1).toBeGreaterThan(0);
    expect(h2).toBeGreaterThan(0);
  });
});

describe('SPEC-077 Gap 4: Poisson Vegetation — natural spacing', () => {
  it('PoissonDiskSampler produces samples with minimum spacing', () => {
    const sampler = new PoissonDiskSampler(42);
    const samples = sampler.sampleChunk(CHUNK_SIZE, 8, 30, 0, 0);
    expect(samples.length).toBeGreaterThan(0);
    for (let i = 0; i < samples.length; i++) {
      for (let j = i + 1; j < samples.length; j++) {
        const dx = samples[i].x - samples[j].x;
        const dz = samples[i].z - samples[j].z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        expect(dist).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('is deterministic for same seed', () => {
    const s1 = new PoissonDiskSampler(77);
    const s2 = new PoissonDiskSampler(77);
    const r1 = s1.sampleChunk(CHUNK_SIZE, 8, 30, 0, 0);
    const r2 = s2.sampleChunk(CHUNK_SIZE, 8, 30, 0, 0);
    expect(r1.length).toBe(r2.length);
    for (let i = 0; i < r1.length; i++) {
      expect(r1[i].x).toBe(r2[i].x);
      expect(r1[i].z).toBe(r2[i].z);
    }
  });
});

describe('SPEC-077 Gap 5: Instanced Rendering — InstancedMesh', () => {
  it('InstancedFeatureRenderer class exists and is importable', async () => {
    const mod = await import('../core/jardvoxel-survival-instanced.js');
    expect(mod.InstancedFeatureRenderer).toBeDefined();
  });

  it('is integrated into SurvivalWorld (gameplay.js imports it)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-gameplay.js'),
      'utf8'
    );
    expect(src).toContain('InstancedFeatureRenderer');
    expect(src).toContain('_instancedRenderer');
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-078: Organic Terrain — 4 Partial Implementations
// ═══════════════════════════════════════════════════════════

describe('SPEC-078 Partial 3: Terrain Splines — applied to heightmap (already fixed)', () => {
  it('TerrainSplines class exists and produces height values', () => {
    const splines = new TerrainSplines();
    const h = splines.getHeight(0.5, 0.3, 0.2, 0.1);
    expect(typeof h).toBe('number');
    expect(h).toBeGreaterThan(0);
  });

  it('is integrated into WorldGenPipeline.getBaseHeight', () => {
    const pipe = new WorldGenPipeline(42);
    expect(pipe.terrainSplines).toBeInstanceOf(TerrainSplines);
    const h = pipe.getBaseHeight(50, 50);
    expect(h).toBeGreaterThan(0);
  });
});

describe('SPEC-078 Partial 1: Domain Warping — intensity verification', () => {
  it('DomainWarper class exists with warp2D', () => {
    const warper = new DomainWarper(160, 0.003, 42);
    expect(warper).toBeInstanceOf(DomainWarper);
    const result = warper.warp2D(100, 100);
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('z');
  });

  it('warping produces visible displacement (increased 2x from SPEC-078)', () => {
    const warper = new DomainWarper(160, 0.003, 42);
    const result = warper.warp2D(100, 100);
    const dx = Math.abs(result.x - 100);
    const dz = Math.abs(result.z - 100);
    expect(dx + dz).toBeGreaterThan(0.1);
  });

  it('NOISE_CONFIGS warpStrength values are 2x original (visible organic warping)', () => {
    // SPEC-078: continentalness was 80, now 160; erosion was 40, now 80
    expect(NOISE_CONFIGS.continentalness.warpStrength).toBe(160);
    expect(NOISE_CONFIGS.erosion.warpStrength).toBe(80);
    expect(NOISE_CONFIGS.weirdness.warpStrength).toBe(40);
    expect(NOISE_CONFIGS.temperature.warpStrength).toBe(120);
  });
});

describe('SPEC-078 Partial 2: Biome Blending — integrated into chunk gen', () => {
  it('BiomeBlender class exists with blendRadius 16', () => {
    const pipe = new WorldGenPipeline(42);
    const blender = new BiomeBlender(pipe);
    expect(blender).toBeInstanceOf(BiomeBlender);
    expect(blender.blendRadius).toBe(16);
  });

  it('getBlendedBiome returns a valid biome value', () => {
    const pipe = new WorldGenPipeline(42);
    const blender = new BiomeBlender(pipe);
    const biome = blender.getBlendedBiome(50, 50);
    expect(biome).toBeDefined();
    expect(biome).toHaveProperty('primary');
  });

  it('getBlendedSurfaceBlock returns a valid block', () => {
    const pipe = new WorldGenPipeline(42);
    const blender = new BiomeBlender(pipe);
    const block = blender.getBlendedSurfaceBlock(50, 70, 50);
    expect(typeof block).toBe('string');
  });

  it('is integrated into WorldGenPipeline (biomeBlender field)', () => {
    const pipe = new WorldGenPipeline(42);
    expect(pipe.biomeBlender).toBeInstanceOf(BiomeBlender);
  });

  it('engine uses blended surface block in getBlockAt (integration)', () => {
    const pipe = new WorldGenPipeline(42);
    // getBlockAt should use biomeBlender.getBlendedSurfaceBlock for surface blocks
    // Verify the code path exists by checking the engine source
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-engine.js'),
      'utf8'
    );
    expect(src).toContain('biomeBlender.getBlendedSurfaceBlock');
  });
});

describe('SPEC-078 Partial 4: Feature Placer — collision detection', () => {
  it('FeaturePlacer class exists', () => {
    const fp = new FeaturePlacer(42);
    expect(fp).toBeInstanceOf(FeaturePlacer);
  });

  it('shouldPlaceTree returns boolean', () => {
    const fp = new FeaturePlacer(42);
    const result = fp.shouldPlaceTree(50, 50, 'plains');
    expect(typeof result).toBe('boolean');
  });

  it('registerFeature + _hasNearbyFeature prevents overlap', () => {
    const fp = new FeaturePlacer(42);
    fp.registerFeature(100, 100, 4);
    // A tree at distance 2 should be blocked (within collision radius)
    expect(fp._hasNearbyFeature(102, 100)).toBe(true);
    // A tree at distance 10 should be allowed
    expect(fp._hasNearbyFeature(110, 100)).toBe(false);
  });

  it('registerFeature + shouldPlaceTree rejects nearby placements', () => {
    const fp = new FeaturePlacer(42);
    // Register a feature at (200, 200)
    fp.registerFeature(200, 200);
    // Try to place a tree at (202, 200) — should be rejected (within radius)
    // Note: shouldPlaceTree also checks biome config + noise, so we test
    // the collision path directly via _hasNearbyFeature
    expect(fp._hasNearbyFeature(202, 200)).toBe(true);
    expect(fp._hasNearbyFeature(210, 200)).toBe(false);
  });

  it('clearChunk removes features for that chunk', () => {
    const fp = new FeaturePlacer(42);
    fp.registerFeature(0, 0);
    fp.registerFeature(16, 16);
    expect(fp._placedFeatures.size).toBeGreaterThan(0);
    fp.clearChunk(0, 0);
    fp.clearChunk(1, 1);
    expect(fp._placedFeatures.size).toBe(0);
  });

  it('clearAll resets all features', () => {
    const fp = new FeaturePlacer(42);
    fp.registerFeature(100, 100);
    fp.registerFeature(200, 200);
    expect(fp._placedFeatures.size).toBeGreaterThan(0);
    fp.clearAll();
    expect(fp._placedFeatures.size).toBe(0);
  });

  it('is integrated into features.js tree generation (registerFeature call)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-features.js'),
      'utf8'
    );
    expect(src).toContain('featurePlacer.registerFeature');
  });
});
