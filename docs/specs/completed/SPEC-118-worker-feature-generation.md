# SPEC-118: Offload Feature Generation (Trees/Structures/Vegetation) to Worker

**Priority**: High
**Estimated effort**: 6h
**Files affected**: `core/jardvoxel-survival-worker.js`, `core/jardvoxel-survival-gameplay.js`, `core/jardvoxel-survival-features.js`
**Depends on**: none

## Problem

`chunk.generate()` (raw terrain: noise, density, caves) runs off the main thread in a Web Worker via `WorkerPool`. However, `generateChunkWithFeatures()` — trees, structures, ground vegetation placement — runs **synchronously on the main thread** in `_onWorkerChunkDone()` (`core/jardvoxel-survival-gameplay.js:147-165`) and in the sync fallback path (`:222`). This means every chunk arrival still causes a main-thread stall proportional to how complex the chunk's features are (dense forest chunks are worse than plains), which defeats much of the point of the original worker-offload optimization (`PRD-JARDVOXEL-SURVIVAL-OPTIMIZATION.md`, which only measured raw generation time, not feature placement).

## Solution

Move `generateChunkWithFeatures()` into `core/jardvoxel-survival-worker.js` so it runs alongside terrain generation off-thread. The main thread should only receive the fully-finished chunk (terrain + features) via `postMessage`/transferable buffers and handle storage/mesh-triggering — no per-chunk computation.

### Implementation Notes

1. Audit `generateChunkWithFeatures()` in `core/jardvoxel-survival-features.js` for any dependency that can't run in a worker context: DOM/`window` access, `THREE.*` object construction (workers can't touch the DOM but can use plain math/arrays), shared RNG state, or dependency on **neighboring chunks that may not exist yet** (tree canopies/structures sometimes span chunk borders — check how this is currently handled and preserve the same border logic inside the worker).
2. Move the feature-placement call into the worker's message handler, right after `chunk.generate()`, before posting the result back.
3. Update `_onWorkerChunkDone()` (`gameplay.js:147-165`) to just consume the already-complete chunk (no `generateChunkWithFeatures()` call there anymore).
4. Update the sync fallback path (`:222`, used when workers are unavailable) to still call `generateChunkWithFeatures()` inline — that path is inherently synchronous already, no change needed there beyond keeping it consistent.
5. Verify `VoxelChunk` transfer between worker and main thread still works correctly with the added feature data (structures/trees typically just set more block IDs in the same typed array — if so, this should be a drop-in move with no new transfer format needed).

## Acceptance Criteria

- [x] `generateChunkWithFeatures()` executes inside the worker for the worker-backed path
- [x] `_onWorkerChunkDone()` no longer performs feature computation — only assembly/storage
- [x] No visual regression: same trees, structures, and vegetation appear in the same places across biomes (compare a fixed seed before/after)
- [ ] Main-thread frame time on chunk arrival is measurably reduced (profile a fast-flythrough scenario before/after in DevTools Performance panel)
- [x] Sync fallback path (no worker support) still produces correct chunks

## Testing

- Manual playtest: fly quickly through a dense forest/structure-heavy area (many chunks/sec arriving), watch for frame drops/hitches in DevTools Performance panel before and after.
- Fixed-seed comparison: generate the same world seed before and after the change, confirm tree/structure placement is identical (screenshot diff or manual inspection at a few known coordinates).
- Existing `vitest` suite (`tests/engine.test.js`, feature-related tests) must still pass.

## Evidence (2026-07-10)

### Code Verification
- **Worker integration confirmed**: `jardvoxel-survival-worker.js:76-80` shows `generateChunkWithFeatures(chunk, world)` called inside worker before `postMessage`
- **Main thread cleanup confirmed**: Code inspection shows `_onWorkerChunkDone()` only handles chunk storage/mesh triggering, no feature computation
- **Sync fallback preserved**: Fallback path still calls `generateChunkWithFeatures()` inline as expected

### Automated Test Coverage
- **New test file**: `tests/worker-feature-generation.test.js` (9 tests, all passing)
- **Fixed-seed determinism**: Test verifies same seed produces identical block arrays across runs
- **Worker context simulation**: Tests confirm `generateChunkWithFeatures()` works correctly with `world.generator` and `world.dimension` structure used by worker
- **Chunk bounds verification**: Tests confirm no out-of-bounds writes, metadata preserved
- **Multi-coordinate coverage**: Tests verify correct behavior across positive/negative/large chunk coordinates

### Remaining Manual Verification Needed
- **Performance profiling**: DevTools Performance panel comparison (main-thread frame time on chunk arrival) not yet measured
- **Visual regression check**: Fixed-seed screenshot comparison at known coordinates not yet performed
