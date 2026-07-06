import { describe, it, expect } from 'vitest';
import { PRNG, PerlinNoise3D, Spline, BIOMES, BIOME_COLORS,
  WORLD_HEIGHT, WORLD_MIN_Y, SEA_LEVEL, CHUNK_SIZE, CHUNK_HEIGHT,
  WorldGenPipeline, VoxelChunk, GreedyMesher,
} from '../core/jardvoxel-survival-engine.js';

describe('PRNG', () => {
  it('produces values in [0, 1)', () => {
    const rng = new PRNG(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic with same seed', () => {
    const r1 = new PRNG(42);
    const r2 = new PRNG(42);
    const seq1 = Array.from({ length: 10 }, () => r1.next());
    const seq2 = Array.from({ length: 10 }, () => r2.next());
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences with different seeds', () => {
    const r1 = new PRNG(1);
    const r2 = new PRNG(2);
    const seq1 = Array.from({ length: 10 }, () => r1.next());
    const seq2 = Array.from({ length: 10 }, () => r2.next());
    expect(seq1).not.toEqual(seq2);
  });

  it('handles seed 0 (defaults to 1)', () => {
    const r = new PRNG(0);
    expect(r.next()).toBeGreaterThanOrEqual(0);
  });
});

describe('PerlinNoise3D', () => {
  it('noise3D returns values in [-1, 1]', () => {
    const noise = new PerlinNoise3D(100);
    for (let i = 0; i < 50; i++) {
      const v = noise.noise3D(i * 0.1, i * 0.2, i * 0.3);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('noise2D returns values in [-1, 1]', () => {
    const noise = new PerlinNoise3D(100);
    for (let i = 0; i < 50; i++) {
      const v = noise.noise2D(i * 0.1, i * 0.2);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic with same seed', () => {
    const n1 = new PerlinNoise3D(50);
    const n2 = new PerlinNoise3D(50);
    expect(n1.noise3D(1.5, 2.3, 0.7)).toBeCloseTo(n2.noise3D(1.5, 2.3, 0.7));
  });

  it('fbm3D returns finite values', () => {
    const noise = new PerlinNoise3D(200);
    const v = noise.fbm3D(10, 20, 30, 4, 0.5, 2, 0.01);
    expect(Number.isFinite(v)).toBe(true);
  });

  it('fbm2D returns finite values', () => {
    const noise = new PerlinNoise3D(200);
    const v = noise.fbm2D(10, 20, 4, 0.5, 2, 0.01);
    expect(Number.isFinite(v)).toBe(true);
  });

  it('noise3D at integer coords returns ~0', () => {
    const noise = new PerlinNoise3D(999);
    const v = noise.noise3D(0, 0, 0);
    expect(Math.abs(v)).toBeLessThan(0.01);
  });
});

describe('Spline', () => {
  it('clamps below first point', () => {
    const s = new Spline([{ x: 0, y: 10 }, { x: 1, y: 20 }]);
    expect(s.evaluate(-5)).toBe(10);
  });

  it('clamps above last point', () => {
    const s = new Spline([{ x: 0, y: 10 }, { x: 1, y: 20 }]);
    expect(s.evaluate(5)).toBe(20);
  });

  it('interpolates between points', () => {
    const s = new Spline([{ x: 0, y: 0 }, { x: 1, y: 10 }]);
    const v = s.evaluate(0.5);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
  });

  it('sorts points by x', () => {
    const s = new Spline([{ x: 2, y: 20 }, { x: 0, y: 0 }, { x: 1, y: 10 }]);
    expect(s.points[0].x).toBe(0);
    expect(s.points[2].x).toBe(2);
  });
});

describe('World constants', () => {
  it('CHUNK_SIZE = 32', () => { expect(CHUNK_SIZE).toBe(32); });
  it('CHUNK_HEIGHT = 384', () => { expect(CHUNK_HEIGHT).toBe(384); });
  it('WORLD_MIN_Y = -64', () => { expect(WORLD_MIN_Y).toBe(-64); });
  it('SEA_LEVEL = 63', () => { expect(SEA_LEVEL).toBe(63); });
  it('BIOMES has 19 entries', () => {
    expect(Object.keys(BIOMES).length).toBe(22);
  });
  it('BIOME_COLORS has entry for each biome', () => {
    for (const b of Object.values(BIOMES)) {
      expect(BIOME_COLORS[b]).toBeDefined();
      expect(BIOME_COLORS[b]).toHaveLength(3);
    }
  });
});

describe('WorldGenPipeline', () => {
  it('constructs with seed', () => {
    const w = new WorldGenPipeline(42);
    expect(w.seed).toBe(42);
  });

  it('getBaseHeight returns reasonable value', () => {
    const w = new WorldGenPipeline(42);
    const h = w.getBaseHeight(0, 0);
    expect(h).toBeGreaterThan(WORLD_MIN_Y);
    expect(h).toBeLessThan(WORLD_HEIGHT + WORLD_MIN_Y);
  });

  it('getBaseHeight is deterministic', () => {
    const w1 = new WorldGenPipeline(42);
    const w2 = new WorldGenPipeline(42);
    expect(w1.getBaseHeight(100, 200)).toBeCloseTo(w2.getBaseHeight(100, 200));
  });
});

describe('VoxelChunk', () => {
  it('constructs with correct dimensions', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    expect(chunk.cx).toBe(0);
    expect(chunk.cz).toBe(0);
    expect(chunk.blocks.length).toBe(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    expect(chunk.generated).toBe(false);
  });

  it('generate sets generated flag', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.generate();
    expect(chunk.generated).toBe(true);
  });

  it('generate is idempotent', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.generate();
    const blocksBefore = chunk.blocks.slice();
    chunk.generate();
    expect(Array.from(chunk.blocks)).toEqual(Array.from(blocksBefore));
  });

  it('getBlock returns 0 for out of bounds', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    expect(chunk.getBlock(-1, 0, 0)).toBe(0);
    expect(chunk.getBlock(0, -1, 0)).toBe(0);
    expect(chunk.getBlock(0, 0, -1)).toBe(0);
    expect(chunk.getBlock(CHUNK_SIZE, 0, 0)).toBe(0);
  });

  it('setBlock and getBlock round-trip', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.setBlock(5, 10, 7, 3);
    expect(chunk.getBlock(5, 10, 7)).toBe(3);
  });

  it('setBlock ignores out of bounds', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.setBlock(-1, 0, 0, 5);
    expect(chunk.getBlock(-1, 0, 0)).toBe(0);
  });
});

describe('GreedyMesher', () => {
  it('returns empty arrays for empty chunk', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.generate();
    // Fill with air
    chunk.blocks.fill(0);
    chunk.generated = true;
    const result = GreedyMesher.mesh(chunk);
    expect(result.positions).toHaveLength(0);
    expect(result.indices).toHaveLength(0);
  });

  it('returns mesh data for non-empty chunk', () => {
    const w = new WorldGenPipeline(42);
    const chunk = new VoxelChunk(0, 0, w);
    chunk.generate();
    const result = GreedyMesher.mesh(chunk);
    expect(result.positions.length).toBeGreaterThan(0);
    expect(result.colors.length).toBeGreaterThan(0);
    expect(result.indices.length).toBeGreaterThan(0);
  });
});
