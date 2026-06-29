import { describe, it, expect } from 'vitest';
import {
  TREE_TYPES,
  AGE_LEVELS,
  HEALTH_LEVELS,
  TREE_GENERATORS,
  GIANT_CHANCE,
  getTreeTypeForBiome,
  generateTree,
  getTreeParamsForPosition,
} from '../core/jardvoxel-survival-tree-personality.js';
import { BIOMES } from '../core/jardvoxel-survival-engine.js';

function makeChunk() {
  const blocks = new Uint8Array(16 * 16 * 384);
  return {
    blocks,
    getBlock(x, y, z) { return blocks[x + z * 16 + y * 16 * 16]; },
    cx: 0, cz: 0,
  };
}

function makeRng(seed = 42) {
  let s = seed;
  return { next: () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } };
}

describe('Tree Personality System', () => {
  it('should define 10 tree types', () => {
    const types = Object.keys(TREE_TYPES);
    expect(types.length).toBe(10);
  });

  it('should have generators for all 10 tree types', () => {
    for (const type of Object.values(TREE_TYPES)) {
      expect(TREE_GENERATORS[type]).toBeDefined();
    }
  });

  it('should map biomes to correct tree types', () => {
    expect(getTreeTypeForBiome(BIOMES.FOREST)).toBe(TREE_TYPES.OAK);
    expect(getTreeTypeForBiome(BIOMES.JUNGLE)).toBe(TREE_TYPES.MANGROVE);
    expect(getTreeTypeForBiome(BIOMES.TAIGA)).toBe(TREE_TYPES.PINE);
    expect(getTreeTypeForBiome(BIOMES.SAVANNA)).toBe(TREE_TYPES.ACACIA);
    expect(getTreeTypeForBiome(BIOMES.MEADOW)).toBe(TREE_TYPES.BIRCH);
    expect(getTreeTypeForBiome(BIOMES.CHERRY_GROVE)).toBe(TREE_TYPES.CHERRY);
    expect(getTreeTypeForBiome(BIOMES.MYSTIC_GROVE)).toBe(TREE_TYPES.MYSTIC_MUSHROOM);
    expect(getTreeTypeForBiome(BIOMES.AUTUMN_FOREST)).toBe(TREE_TYPES.AUTUMN_OAK);
  });

  it('should return null for biomes without trees', () => {
    expect(getTreeTypeForBiome(BIOMES.OCEAN)).toBeNull();
    expect(getTreeTypeForBiome(BIOMES.DESERT)).toBeNull();
    expect(getTreeTypeForBiome(BIOMES.BEACH)).toBeNull();
  });

  it('should generate tree params from position', () => {
    const params = getTreeParamsForPosition(100, 200);
    expect(params.age).toBeDefined();
    expect(params.health).toBeDefined();
    expect(params.variation).toBeTypeOf('number');
  });

  it('should produce deterministic params for same position', () => {
    const p1 = getTreeParamsForPosition(100, 200);
    const p2 = getTreeParamsForPosition(100, 200);
    expect(p1.age).toBe(p2.age);
    expect(p1.health).toBe(p2.health);
  });

  it('should produce different params for different positions', () => {
    const positions = [];
    for (let i = 0; i < 20; i++) {
      positions.push(getTreeParamsForPosition(i * 100, i * 200));
    }
    const ages = new Set(positions.map(p => p.age));
    expect(ages.size).toBeGreaterThan(1);
  });

  it('should generate oak tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.OAK, 5, 5, rng)).not.toThrow();
  });

  it('should generate pine tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.PINE, 5, 5, rng)).not.toThrow();
  });

  it('should generate mangrove tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.MANGROVE, 5, 5, rng)).not.toThrow();
  });

  it('should generate dead tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.DEAD, 5, 5, rng)).not.toThrow();
  });

  it('should generate acacia tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.ACACIA, 5, 5, rng)).not.toThrow();
  });

  it('should generate giant tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.GIANT, 5, 5, rng)).not.toThrow();
  });

  it('should generate birch tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.BIRCH, 5, 5, rng)).not.toThrow();
  });

  it('should generate cherry tree without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.CHERRY, 5, 5, rng)).not.toThrow();
  });

  it('should generate mystic mushroom without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.MYSTIC_MUSHROOM, 5, 5, rng)).not.toThrow();
  });

  it('should generate autumn oak without crashing', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, TREE_TYPES.AUTUMN_OAK, 5, 5, rng)).not.toThrow();
  });

  it('should place blocks when generating oak tree', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    generateTree(chunk, 5, 64, 5, TREE_TYPES.OAK, 5, 5, rng);
    let hasLog = false;
    for (let i = 0; i < chunk.blocks.length; i++) {
      if (chunk.blocks[i] !== 0) { hasLog = true; break; }
    }
    expect(hasLog).toBe(true);
  });

  it('should return tree info from generateTree', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    const info = generateTree(chunk, 5, 64, 5, TREE_TYPES.OAK, 5, 5, rng);
    expect(info.type).toBeDefined();
    expect(info.age).toBeDefined();
    expect(info.health).toBeDefined();
  });

  it('should have giant chance < 0.1%', () => {
    expect(GIANT_CHANCE).toBeLessThan(0.001);
  });

  it('should have age levels', () => {
    expect(AGE_LEVELS.YOUNG).toBe('young');
    expect(AGE_LEVELS.MATURE).toBe('mature');
    expect(AGE_LEVELS.OLD).toBe('old');
  });

  it('should have health levels', () => {
    expect(HEALTH_LEVELS.ALIVE).toBe('alive');
    expect(HEALTH_LEVELS.DYING).toBe('dying');
    expect(HEALTH_LEVELS.DEAD).toBe('dead');
  });

  it('should not crash with unknown tree type', () => {
    const chunk = makeChunk();
    const rng = makeRng();
    expect(() => generateTree(chunk, 5, 64, 5, 'unknown_type', 5, 5, rng)).not.toThrow();
  });
});
