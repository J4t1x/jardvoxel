# SPEC-PERF-004: Chunk Object Pooling in SurvivalWorld

**Priority**: Medium
**Estimated effort**: 3h
**Files affected**: `core/jardvoxel-survival-gameplay.js`

## Problem

`SurvivalWorld` has a `chunkPool` array (line 62) with `maxPoolSize = 1200`, but the pool is never actually used. When chunks are unloaded via `_removeChunk()` (line 620), the `VoxelChunk` objects are simply dereferenced and left for GC. When new chunks are generated, new `VoxelChunk` objects are allocated.

With render distance 16 and player movement, chunks are constantly created and destroyed. Each `VoxelChunk` contains a `Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT)` = 65,536 bytes. Constant allocation/deallocation causes GC pressure and memory fragmentation.

## Solution

Implement proper object pooling for `VoxelChunk`:

### Implementation

1. **`_acquireChunk(cx, cz)`**: Get a chunk from pool or create new one
   ```js
   _acquireChunk(cx, cz) {
     let chunk;
     if (this.chunkPool.length > 0) {
       chunk = this.chunkPool.pop();
       chunk.cx = cx;
       chunk.cz = cz;
       chunk.blocks.fill(0); // Clear blocks
       chunk.generated = false;
       chunk.minContentY = undefined;
       chunk.maxContentY = undefined;
     } else {
       chunk = new VoxelChunk(cx, cz, this);
     }
     return chunk;
   }
   ```

2. **`_releaseChunk(chunk)`**: Return chunk to pool instead of dereferencing
   ```js
   _releaseChunk(chunk) {
     if (this.chunkPool.length < this.maxPoolSize) {
       this.chunkPool.push(chunk);
     }
     // If pool full, let GC handle it
   }
   ```

3. **Update `_removeChunk()`** to call `_releaseChunk()` instead of just deleting
4. **Update `_getOrCreateChunk()`** to use `_acquireChunk()`
5. **Update `_onWorkerChunkDone()`** to use pool when creating chunk from worker data

## Acceptance Criteria

- [ ] `chunkPool` actually used (chunks acquired from pool and released to pool)
- [ ] No new `VoxelChunk` allocations after steady state (pool warm)
- [ ] `chunk.blocks.fill(0)` called on reuse to prevent stale data
- [ ] Pool size capped at `maxPoolSize` (excess chunks go to GC)
- [ ] No visual regression (chunks load correctly)
- [ ] Reduced GC pressure visible in Chrome DevTools Memory tab

## Testing

- Open `jardvoxel-zen.html`, fly continuously for 5 minutes
- Check Chrome DevTools Memory tab for reduced GC events
- Verify no stale blocks appear in newly loaded chunks
- Verify chunk loading/unloading works as before
