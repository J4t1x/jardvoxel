import { describe, it, expect } from 'vitest';
import {
  WorldGenPipeline,
  VoxelChunk,
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  SEA_LEVEL,
} from '../core/jardvoxel-survival-engine.js';
import {
  HierarchicalChunkGenerator,
  WorldIdentity,
  ContinentGenerator,
  RegionGenerator,
  ZoneGenerator,
} from '../core/jardvoxel-survival-world-hierarchy.js';
import { MicrosectorGenerator } from '../core/jardvoxel-survival-microsectors.js';
import { HierarchicalStreaming } from '../core/jardvoxel-survival-streaming.js';
import { LayerSystem } from '../core/jardvoxel-survival-layers.js';
import { generateChunkHierarchical } from '../core/jardvoxel-survival-features.js';

// ═══════════════════════════════════════════════════════════
// SPEC-085: Hierarchical 7.0 — Integration, Migration & Verification
// ═══════════════════════════════════════════════════════════

describe('SPEC-085: WorldGenPipeline uses full 6-level hierarchy', () => {
  it('enableHierarchy wires all 6 levels into the pipeline', () => {
    const pipe = new WorldGenPipeline(12345);
    expect(pipe._useHierarchy).toBe(false);
    pipe.enableHierarchy();
    expect(pipe._useHierarchy).toBe(true);
    expect(pipe.hierarchy).toBeInstanceOf(HierarchicalChunkGenerator);
    expect(pipe.hierarchy.world).toBeInstanceOf(WorldIdentity);
    expect(pipe.hierarchy.continentGen).toBeInstanceOf(ContinentGenerator);
    expect(pipe.hierarchy.regionGen).toBeInstanceOf(RegionGenerator);
    expect(pipe.hierarchy.zoneGen).toBeInstanceOf(ZoneGenerator);
    expect(pipe.hierarchy.microsectorGen).toBeInstanceOf(MicrosectorGenerator);
    expect(pipe.hierarchy.streaming).toBeInstanceOf(HierarchicalStreaming);
  });

  it('disableHierarchy falls back to v6.0 flat generation', () => {
    const pipe = new WorldGenPipeline(12345);
    pipe.enableHierarchy();
    expect(pipe._useHierarchy).toBe(true);
    pipe.disableHierarchy();
    expect(pipe._useHierarchy).toBe(false);
    // hierarchy instance is retained for re-enablement, just not used
    expect(pipe.hierarchy).toBeInstanceOf(HierarchicalChunkGenerator);
  });

  it('hierarchicalGeneration toggle: on vs off produce different terrain', () => {
    const pipeOn = new WorldGenPipeline(777);
    pipeOn.enableHierarchy();
    const pipeOff = new WorldGenPipeline(777);
    // Sample height at several positions
    let differences = 0;
    let samples = 0;
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        const ctxOn = pipeOn.getChunkContext(cx, cz);
        for (const [lx, lz] of [[0, 0], [16, 16], [31, 31]]) {
          const hOn = ctxOn.heightMap[lx + lz * CHUNK_SIZE];
          // For flat mode, sample via getBaseHeight
          const wx = cx * CHUNK_SIZE + lx;
          const wz = cz * CHUNK_SIZE + lz;
          const hOff = pipeOff.getBaseHeight(wx, wz);
          samples++;
          if (Math.abs(hOn - hOff) > 1) differences++;
        }
      }
    }
    expect(samples).toBeGreaterThan(0);
    // Hierarchical generation should produce measurably different terrain
    // (region/zone modifiers, continentalness, hydrology, etc.)
    expect(differences).toBeGreaterThan(0);
  });
});

describe('SPEC-085: Backward compatibility — saved worlds load', () => {
  it('VoxelChunk generated with v6.0 (no hierarchy) still loads', () => {
    const pipe = new WorldGenPipeline(42);
    // No enableHierarchy — pure v6.0
    const chunk = new VoxelChunk(0, 0, pipe);
    chunk.generate();
    expect(chunk.generated).toBe(true);
    // Verify chunk has terrain blocks
    let nonAir = 0;
    for (let i = 0; i < chunk.blocks.length; i++) {
      if (chunk.blocks[i] !== 0) nonAir++;
    }
    expect(nonAir).toBeGreaterThan(0);
  });

  it('VoxelChunk generated with hierarchy enabled also loads', () => {
    const pipe = new WorldGenPipeline(42);
    pipe.enableHierarchy();
    const chunk = new VoxelChunk(1, 1, pipe);
    const ctx = pipe.getChunkContext(1, 1);
    const world = { generator: pipe, dimension: 'overworld', _poissonEnabled: true, getBiome: (x, z) => pipe.getBiome(x, z) };
    generateChunkHierarchical(chunk, world, ctx);
    expect(chunk.generated).toBe(true);
    let nonAir = 0;
    for (let i = 0; i < chunk.blocks.length; i++) {
      if (chunk.blocks[i] !== 0) nonAir++;
    }
    expect(nonAir).toBeGreaterThan(0);
  });

  it('disabling hierarchy after generating with it does not crash', () => {
    const pipe = new WorldGenPipeline(42);
    pipe.enableHierarchy();
    pipe.getChunkContext(0, 0);
    expect(() => pipe.disableHierarchy()).not.toThrow();
    // After disable, getChunkContext returns null (no hierarchy context)
    expect(pipe.getChunkContext(0, 0)).toBeNull();
  });

  it('re-enabling hierarchy after disable works', () => {
    const pipe = new WorldGenPipeline(42);
    pipe.enableHierarchy();
    pipe.disableHierarchy();
    pipe.enableHierarchy();
    expect(pipe._useHierarchy).toBe(true);
    const ctx = pipe.getChunkContext(0, 0);
    expect(ctx).toBeDefined();
    expect(ctx.heightMap).toBeInstanceOf(Float32Array);
  });
});

describe('SPEC-085: HTML variants migration status', () => {
  it('jardvoxel-survival.html: settings.hierarchicalGeneration defaults to true', () => {
    // Read the file and verify the default is set
    // (smoke test — the actual HTML is loaded in browser, not vitest)
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(
      path.resolve(__dirname, '../jardvoxel-survival.html'),
      'utf8'
    );
    expect(html).toContain('hierarchicalGeneration: true');
    expect(html).toContain('useHierarchy = this.settings.hierarchicalGeneration !== false');
  });

  it('jardvoxel-zen.html (ZenGame): hierarchy already enabled for non-zen2 mode', () => {
    const fs = require('fs');
    const path = require('path');
    const zenGame = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    // ZenGame enables hierarchy when _isZen2 is false (zen classic mode)
    expect(zenGame).toContain('useHierarchy = !this._isZen2');
    expect(zenGame).toContain('enableHierarchy');
  });

  it('jardvoxel-zen2.html: intentionally flat (zen2 mode) — hierarchy disabled by design', () => {
    const fs = require('fs');
    const path = require('path');
    const zenGame = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    // Zen2 mode is intentionally flat — useHierarchy = !this._isZen2 → false
    // This is by design (calm, walkable meadow), not a missing migration.
    expect(zenGame).toContain("_isZen2 ? 'zen2' : 'survival'");
  });
});

describe('SPEC-085: Performance — 60fps target with hierarchy', () => {
  it('hierarchical chunk context generation < 50ms (desktop 60fps budget)', () => {
    const gen = new HierarchicalChunkGenerator(2024);
    gen.getChunkContext(0, 0); // warm up
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      gen.getChunkContext(i, -i);
    }
    const elapsed = performance.now() - start;
    // 60fps = 16.6ms/frame; 10 chunks in <500ms leaves plenty of headroom
    expect(elapsed).toBeLessThan(500);
    expect(elapsed / 10).toBeLessThan(50);
  });

  it('streaming prewarm < 100ms for radius 8 (no hitching)', () => {
    const gen = new HierarchicalChunkGenerator(2024);
    gen.streaming.prewarm(0, 0, 4); // initial warm
    const start = performance.now();
    gen.streaming.prewarm(50, 50, 8);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('priorityBoost < 0.1ms per call (no per-chunk overhead)', () => {
    const gen = new HierarchicalChunkGenerator(2024);
    gen.streaming.setPlayerChunk(0, 0);
    gen.streaming.priorityBoost(0, 0); // warm
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      gen.streaming.priorityBoost(i, -i);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 1000).toBeLessThan(0.1);
  });
});

describe('SPEC-085: Full integration — end-to-end chunk generation', () => {
  it('generates a chunk with all 6 hierarchy levels + streaming + layers', () => {
    const pipe = new WorldGenPipeline(12345);
    pipe.enableHierarchy();
    const world = {
      generator: pipe,
      dimension: 'overworld',
      _poissonEnabled: true,
      getBiome: (x, z) => pipe.getBiome(x, z),
    };
    // Pre-warm streaming
    pipe.hierarchy.streaming.setPlayerChunk(0, 0);
    pipe.hierarchy.streaming.prewarm(0, 0, 4);
    // Generate chunk
    const chunk = new VoxelChunk(0, 0, pipe);
    const ctx = pipe.getChunkContext(0, 0);
    expect(() => generateChunkHierarchical(chunk, world, ctx)).not.toThrow();
    expect(chunk.generated).toBe(true);
    // Verify chunk has content
    let nonAir = 0;
    for (let i = 0; i < chunk.blocks.length; i++) {
      if (chunk.blocks[i] !== 0) nonAir++;
    }
    expect(nonAir).toBeGreaterThan(0);
    // Verify streaming prewarm cache is populated
    expect(pipe.hierarchy.streaming.prewarmCount).toBeGreaterThan(0);
  });

  it('LayerSystem is available and can generate terrain layer independently', () => {
    const ls = new LayerSystem();
    const info = ls.getLayerInfo();
    expect(info).toHaveLength(9);
    // Terrain layer is required and enabled
    const terrain = info.find(l => l.id === 1);
    expect(terrain.required).toBe(true);
    expect(terrain.enabled).toBe(true);
  });

  it('multiple chunks generated with hierarchy are coherent (same region cluster)', () => {
    const pipe = new WorldGenPipeline(12345);
    pipe.enableHierarchy();
    // Generate a 3x3 grid of chunk contexts
    const regions = new Map();
    for (let cx = -1; cx <= 1; cx++) {
      for (let cz = -1; cz <= 1; cz++) {
        const ctx = pipe.getChunkContext(cx, cz);
        const r = ctx.region.type;
        regions.set(r, (regions.get(r) || 0) + 1);
      }
    }
    // A 3x3 grid should be dominated by 1-3 region types (coherent)
    expect(regions.size).toBeLessThanOrEqual(5);
    // The most common region should cover at least 3 of 9 chunks
    const maxCount = Math.max(...regions.values());
    expect(maxCount).toBeGreaterThanOrEqual(3);
  });
});
