# SPEC-PERF-003: Optimize Minimap Rendering with Heightmap Cache

**Priority**: Medium
**Estimated effort**: 2h
**Files affected**: `core/jardvoxel-zen-game.js`

## Problem

The minimap rendering at `@jardvoxel-zen-game.js:1000-1037` scans a 30x30 block area every 4 seconds. For each block, it iterates up to 20 Y levels calling `this.world.getBlock()`. That's ~1800 `getBlock()` calls per minimap update, each involving chunk lookup + array indexing.

The chunk manager already maintains `_heightmaps` (a Map of `Uint8Array` per chunk) that stores the top non-air block Y for every column. This data is available but not used by the minimap.

## Solution

Replace the per-block Y-scanning loop with heightmap lookups from `this.world._heightmaps`.

### Implementation

1. For each minimap sample point `(wx, wz)`:
   - Calculate chunk coords: `cx = Math.floor(wx / CHUNK_SIZE)`, `cz = Math.floor(wz / CHUNK_SIZE)`
   - Get heightmap: `const hm = this.world._heightmaps.get(this.world._chunkKey(cx, cz))`
   - If heightmap exists, read `topY = hm.heights[lx + lz * CHUNK_SIZE]` and determine block type from `this.world.getBlock(wx, WORLD_MIN_Y + topY, wz)` (single call instead of up to 20)
   - If no heightmap, fall back to current scanning behavior

2. This reduces ~1800 `getBlock()` calls to ~900 (one per sample point instead of up to 20 per point).

### Alternative (even faster)

Store the block type at the top Y in the heightmap itself (currently only stores Y). Add `topBlock` to the heightmap structure:
```js
this._heightmaps.set(key, { heights, avgHeight, topBlocks });
```
Where `topBlocks` is a `Uint8Array` of block IDs. This eliminates all `getBlock()` calls during minimap rendering.

## Acceptance Criteria

- [ ] Minimap uses heightmap data for block color lookup
- [ ] Minimap rendering time reduced by >50% (measurable via `performance.now()`)
- [ ] Minimap colors match previous behavior (no visual regression)
- [ ] Fallback for missing heightmap data works correctly
- [ ] No console errors when chunks are unloaded during minimap render

## Testing

- Open `jardvoxel-zen.html`, fly at high altitude
- Verify minimap shows correct terrain colors
- Verify minimap updates every ~4 seconds as before
- Check performance tab for reduced main thread blocking during minimap update
