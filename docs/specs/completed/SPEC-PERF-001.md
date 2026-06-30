# SPEC-PERF-001: Eliminate Per-Frame Garbage from String Key Parsing

**Priority**: High
**Estimated effort**: 3h
**Files affected**: `core/jardvoxel-survival-gameplay.js`, `core/jardvoxel-engine.js`

## Problem

The chunk manager uses string keys (`"cx,cz"`) for Map lookups. In hot paths (frustum culling, LOD checks, chunk unloading), these keys are parsed back to numbers via `key.split(',').map(Number)` or `key.split(',')` + `parseInt()`. With render distance 16, this creates hundreds of temporary arrays and Number objects every 0.15s–0.5s, generating significant GC pressure.

### Affected hot paths

1. **Frustum culling** (`jardvoxel-survival-gameplay.js:553`) — iterates all meshes every 0.15s, calls `key.split(',').map(Number)` per mesh
2. **LOD re-meshing** (`jardvoxel-survival-gameplay.js:494-496`) — iterates all meshes every 0.5s, calls `key.split(',')` + `parseInt()` per mesh
3. **Chunk unloading** (`jardvoxel-survival-gameplay.js:517-537`) — iterates all chunks per frame, parses `chunk.cx`/`chunk.cz` (already cached on chunk object, but mesh loop uses string keys)
4. **Water mesh visibility sync** (`jardvoxel-survival-gameplay.js:584`) — iterates waterMeshes every 0.15s
5. **Same pattern in `jardvoxel-engine.js`** ChunkManager (lines 2428, 2440, 2460)

## Solution

Store `cx` and `cz` as numeric properties on mesh `userData` at creation time. Use these cached values instead of parsing string keys.

### Implementation

1. In `_rebuildChunkMesh()` and `_buildMeshForChunk()`, add:
   ```js
   mesh.userData.cx = cx;
   mesh.userData.cz = cz;
   ```
   Same for water meshes.

2. Replace all `key.split(',').map(Number)` in hot paths with:
   ```js
   const cx = mesh.userData.cx;
   const cz = mesh.userData.cz;
   ```

3. For chunk unloading loop, use `chunk.cx` / `chunk.cz` (already available on VoxelChunk).

4. For water mesh visibility sync, use `wmesh.userData.cx` / `wmesh.userData.cz`.

## Acceptance Criteria

- [ ] No `split(',')` or `map(Number)` calls in `update()` method of SurvivalWorld
- [ ] No `split(',')` or `map(Number)` calls in `update()` method of ChunkManager
- [ ] `mesh.userData.cx` and `mesh.userData.cz` set at mesh creation in both classes
- [ ] Water meshes also have `userData.cx` / `userData.cz`
- [ ] Game runs at 60fps with render distance 16
- [ ] No console errors
- [ ] Chunks load/unload correctly (no visual regression)

## Testing

- Open `jardvoxel-zen.html` in browser, fly around for 2 minutes
- Check Chrome DevTools Performance tab for reduced GC events
- Verify chunk loading/unloading works as before
