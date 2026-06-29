# SPEC-104: Hierarchical Chunk Generator — Level 5

**Priority:** Critical  
**Estimate:** 1.5h  
**Depends on:** SPEC-100, SPEC-101, SPEC-102, SPEC-103  
**Blocked by:** SPEC-103

## Description

Refactor chunk generation so chunks only materialize terrain from upper-level data. Chunks (16x16) stop deciding biomes, climate, or major geography — they only build terrain from pre-computed hierarchy data.

## Requirements

1. `HierarchicalChunkGenerator` class that:
   - Receives `WorldIdentity`, `ContinentGenerator`, `RegionGenerator`, `ZoneGenerator`
   - Pre-computes a `ChunkContext` per chunk coordinate containing:
     - `continent`: blended continent properties
     - `region`: region type + modifiers
     - `zone`: zone type + feature list
     - `biomeWeights`: pre-computed biome blend
     - `heightMap`: 16x16 height array
     - `waterLevel`: local water level
   - `getChunkContext(cx, cz)` — returns cached or computes ChunkContext
   - `generateChunk(chunk, context)` — fills chunk blocks using context only

2. Height generation uses:
   - Continent altitude modifier
   - Region height modifier
   - Zone local features (hills, valleys)
   - Existing `TerrainSplines` for base shape
   - Existing `BiomeTerrainModulator` for biome-specific modulation

3. Biome assignment from pre-computed `biomeWeights` (no per-block biome calculation)

## Acceptance Criteria

- [ ] Chunk generation no longer calls `getBiome()` per block
- [ ] `ChunkContext` is cached and reused
- [ ] Terrain height is consistent with v6.0 (no visual regression)
- [ ] Generation time per chunk is equal or faster than v6.0
- [ ] Existing cave/ore/structure generation still works

## Implementation Notes

- `ChunkContext` cache: Map keyed by `cx,cz`, LRU eviction
- Height map: compute 16x16 grid using spline + continent/region/zone modifiers
- Biome weights: sample at chunk center + 4 corners, interpolate
- Caves/ores: still use 3D noise per block (not hierarchical)
- Structure placement: deferred to SPEC-110 (contextual generation)
