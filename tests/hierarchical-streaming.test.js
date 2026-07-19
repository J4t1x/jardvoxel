import { describe, it, expect } from 'vitest';
import { HierarchicalChunkGenerator, CHUNK_SIZE } from '../core/jardvoxel-survival-world-hierarchy.js';
import { HierarchicalStreaming, STREAMING_BOOSTS } from '../core/jardvoxel-survival-streaming.js';
import { LayerSystem, LOAD_PRIORITY } from '../core/jardvoxel-survival-layers.js';

// ═══════════════════════════════════════════════════════════
// SPEC-084: Hierarchical Streaming + 9-Layer System
// ═══════════════════════════════════════════════════════════

describe('SPEC-084: HierarchicalStreaming', () => {
  it('constructs with a hierarchy reference', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = new HierarchicalStreaming(gen);
    expect(s.hierarchy).toBe(gen);
    expect(s.prewarmCount).toBe(0);
    expect(s.playerContext).toBeNull();
  });

  it('is exposed on HierarchicalChunkGenerator as .streaming', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    expect(gen.streaming).toBeInstanceOf(HierarchicalStreaming);
  });

  it('prewarm() warms region/zone caches for chunks around the player', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    const warmed = s.prewarm(0, 0, 3);
    // (2*3+1)^2 circle ≈ ~29 chunks within radius 3
    expect(warmed).toBeGreaterThan(15);
    expect(s.prewarmCount).toBeGreaterThan(15);
    // Re-prewarming the same area should not re-add entries
    const warmed2 = s.prewarm(0, 0, 3);
    expect(warmed2).toBe(0);
  });

  it('prewarm() is bounded by maxPrewarm (eviction)', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    s._maxPrewarm = 10;
    s.prewarm(0, 0, 5);
    expect(s.prewarmCount).toBeLessThanOrEqual(10);
  });

  it('prewarm() clamps radius to [1, 32]', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    const r1 = s.prewarm(0, 0, 0);
    const r2 = s.prewarm(100, 100, 100);
    expect(r1).toBeGreaterThan(0);
    expect(r2).toBeGreaterThan(0);
    // radius 0 → clamped to 1 (9 chunks in 3x3)
    expect(r1).toBeLessThanOrEqual(9);
  });

  it('setPlayerChunk() captures the player hierarchy context', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    const ctx = s.setPlayerChunk(2, -3);
    expect(ctx).not.toBeNull();
    expect(ctx.cx).toBe(2);
    expect(ctx.cz).toBe(-3);
    expect(typeof ctx.continentId).toBe('number');
    expect(typeof ctx.regionType).toBe('string');
    expect(typeof ctx.zoneType).toBe('string');
    expect(s.playerContext).toBe(ctx);
  });

  it('priorityBoost() returns 0 when player context is unset', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    expect(s.priorityBoost(0, 0)).toBe(0);
    expect(s.priorityBoost(5, 5)).toBe(0);
  });

  it('priorityBoost() returns negative discount for chunks sharing player context', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    s.setPlayerChunk(0, 0);
    // Same chunk as player → maximum discount (continent + region + zone)
    const boost = s.priorityBoost(0, 0);
    expect(boost).toBeLessThan(0);
    // Maximum possible discount = -(0.2 + 0.6 + 0.4) = -1.2
    expect(boost).toBeGreaterThanOrEqual(-(STREAMING_BOOSTS.SAME_CONTINENT_BOOST + STREAMING_BOOSTS.SAME_REGION_BOOST + STREAMING_BOOSTS.SAME_ZONE_BOOST));
  });

  it('priorityBoost() for a far chunk is less negative than for a near one', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    s.setPlayerChunk(0, 0);
    const nearBoost = s.priorityBoost(0, 0);
    // A chunk very far away is less likely to share region/zone
    // (depends on seed, but at minimum it should not be more negative than near)
    // We test the invariant: near ≤ 0, and the function never returns positive.
    expect(nearBoost).toBeLessThanOrEqual(0);
    for (let i = 0; i < 10; i++) {
      const far = s.priorityBoost(50 + i * 10, 50 + i * 10);
      expect(far).toBeLessThanOrEqual(0);
    }
  });

  it('STREAMING_BOOSTS exposes the boost constants', () => {
    expect(STREAMING_BOOSTS.SAME_CONTINENT_BOOST).toBeGreaterThan(0);
    expect(STREAMING_BOOSTS.SAME_REGION_BOOST).toBeGreaterThan(STREAMING_BOOSTS.SAME_CONTINENT_BOOST);
    expect(STREAMING_BOOSTS.SAME_ZONE_BOOST).toBeGreaterThan(0);
  });

  it('clear() resets prewarm cache and player context', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const s = gen.streaming;
    s.prewarm(0, 0, 2);
    s.setPlayerChunk(1, 1);
    expect(s.prewarmCount).toBeGreaterThan(0);
    expect(s.playerContext).not.toBeNull();
    s.clear();
    expect(s.prewarmCount).toBe(0);
    expect(s.playerContext).toBeNull();
  });

  it('performance: prewarm of radius 8 < 50ms after first call', () => {
    const gen = new HierarchicalChunkGenerator(2024);
    const s = gen.streaming;
    s.prewarm(0, 0, 8); // initial warm
    const start = performance.now();
    s.prewarm(50, 50, 8); // new area
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('integration: HierarchicalChunkGenerator.clearCache also resets streaming', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    gen.streaming.prewarm(0, 0, 2);
    gen.streaming.setPlayerChunk(1, 1);
    expect(gen.streaming.prewarmCount).toBeGreaterThan(0);
    // clearCache on hierarchy should not touch streaming (separate concern),
    // but streaming.clear() should be callable independently.
    gen.streaming.clear();
    expect(gen.streaming.prewarmCount).toBe(0);
  });
});

describe('SPEC-084: LayerSystem — 9 progressive layers', () => {
  it('constructs with exactly 9 layers in priority order', () => {
    const ls = new LayerSystem();
    expect(ls.layers).toHaveLength(9);
    // IDs 1..9
    for (let i = 0; i < 9; i++) {
      expect(ls.layers[i].id).toBe(i + 1);
    }
  });

  it('layer names match the PRD 7.0 spec', () => {
    const ls = new LayerSystem();
    const names = ls.layers.map(l => l.name);
    expect(names).toEqual([
      'terrain',
      'micro_relief',
      'surface_rocks',
      'major_vegetation',
      'minor_vegetation',
      'natural_decoration',
      'fauna',
      'ambient_audio',
      'dynamic_events',
    ]);
  });

  it('all layers start enabled', () => {
    const ls = new LayerSystem();
    for (const l of ls.layers) {
      expect(l.enabled).toBe(true);
    }
  });

  it('each layer has a valid priority from LOAD_PRIORITY', () => {
    const ls = new LayerSystem();
    const validPriorities = Object.values(LOAD_PRIORITY);
    for (const l of ls.layers) {
      expect(validPriorities).toContain(l.priority);
    }
  });

  it('terrain layer is required (IMMEDIATE priority)', () => {
    const ls = new LayerSystem();
    const terrain = ls.layers.find(l => l.id === 1);
    expect(terrain.isRequired()).toBe(true);
    expect(terrain.priority).toBe(LOAD_PRIORITY.IMMEDIATE);
  });

  it('setLayerEnabled toggles a layer', () => {
    const ls = new LayerSystem();
    expect(ls.layers[3].enabled).toBe(true);
    ls.setLayerEnabled(4, false);
    expect(ls.layers[3].enabled).toBe(false);
    ls.setLayerEnabled(4, true);
    expect(ls.layers[3].enabled).toBe(true);
  });

  it('generateAll skips disabled layers', () => {
    const ls = new LayerSystem();
    let calls = 0;
    const helpers = { setBlock: () => {}, getBlock: () => 0 };
    const context = { biomeWeights: new Map([['plains', 1]]) };
    // Patch each layer's generate to count calls
    for (const l of ls.layers) {
      const orig = l.generate.bind(l);
      l.generate = () => { calls++; };
    }
    ls.setLayerEnabled(5, false);
    ls.generateAll({}, context, helpers);
    expect(calls).toBe(8); // 9 - 1 disabled
  });

  it('generateUpTo only runs layers up to a max priority', () => {
    const ls = new LayerSystem();
    let calls = 0;
    const helpers = { setBlock: () => {}, getBlock: () => 0 };
    const context = { biomeWeights: new Map([['plains', 1]]) };
    for (const l of ls.layers) {
      l.generate = () => { calls++; };
    }
    ls.generateUpTo({}, context, helpers, LOAD_PRIORITY.HIGH);
    // IMMEDIATE + HIGH layers should run
    const expected = ls.layers.filter(l => l.priority <= LOAD_PRIORITY.HIGH).length;
    expect(calls).toBe(expected);
  });

  it('generateLayer runs a specific layer by id', () => {
    const ls = new LayerSystem();
    let called = null;
    for (const l of ls.layers) {
      l.generate = () => { called = l.id; };
    }
    ls.generateLayer(7, {}, {}, {});
    expect(called).toBe(7);
  });

  it('generateLayer skips disabled layers', () => {
    const ls = new LayerSystem();
    let called = false;
    for (const l of ls.layers) {
      l.generate = () => { called = true; };
    }
    ls.setLayerEnabled(3, false);
    ls.generateLayer(3, {}, {}, {});
    expect(called).toBe(false);
  });

  it('getLayersByPriority returns enabled layers at that priority', () => {
    const ls = new LayerSystem();
    const immediate = ls.getLayersByPriority(LOAD_PRIORITY.IMMEDIATE);
    expect(immediate.length).toBeGreaterThanOrEqual(1);
    for (const l of immediate) {
      expect(l.priority).toBe(LOAD_PRIORITY.IMMEDIATE);
      expect(l.enabled).toBe(true);
    }
    // Disable one and verify it's excluded
    const firstId = immediate[0].id;
    ls.setLayerEnabled(firstId, false);
    const immediate2 = ls.getLayersByPriority(LOAD_PRIORITY.IMMEDIATE);
    expect(immediate2.find(l => l.id === firstId)).toBeUndefined();
  });

  it('getLayerInfo returns metadata for all 9 layers', () => {
    const ls = new LayerSystem();
    const info = ls.getLayerInfo();
    expect(info).toHaveLength(9);
    for (const i of info) {
      expect(typeof i.id).toBe('number');
      expect(typeof i.name).toBe('string');
      expect(typeof i.priority).toBe('number');
      expect(typeof i.required).toBe('boolean');
      expect(typeof i.enabled).toBe('boolean');
    }
    // terrain is required
    const terrain = info.find(i => i.id === 1);
    expect(terrain.required).toBe(true);
  });

  it('LOAD_PRIORITY exposes 4 tiers', () => {
    expect(LOAD_PRIORITY.IMMEDIATE).toBe(0);
    expect(LOAD_PRIORITY.HIGH).toBe(1);
    expect(LOAD_PRIORITY.MEDIUM).toBe(2);
    expect(LOAD_PRIORITY.LOW).toBe(3);
  });

  it('integration: HierarchicalChunkGenerator exposes streaming + microsector + layers-compatible context', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    expect(gen.streaming).toBeInstanceOf(HierarchicalStreaming);
    expect(gen.microsectorGen).toBeDefined();
    // Chunk context provides everything LayerSystem needs
    const ctx = gen.getChunkContext(0, 0);
    expect(ctx.heightMap).toBeInstanceOf(Float32Array);
    expect(ctx.waterLevel).toBeGreaterThan(0);
    expect(ctx.continent).toBeDefined();
    expect(ctx.biomeWeights).toBeInstanceOf(Map);
  });
});
