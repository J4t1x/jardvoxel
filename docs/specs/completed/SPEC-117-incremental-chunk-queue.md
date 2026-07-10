# SPEC-117: Replace Per-Frame Full-Grid Chunk Scan with Incremental Queue

**Priority**: High
**Estimated effort**: 4h
**Files affected**: `core/jardvoxel-survival-gameplay.js`
**Depends on**: SPEC-116 (reuses its priority key; implement after so the incremental queue is built with angle-aware ordering from the start)

## Problem

`SurvivalWorld.update()` builds a fresh `toGen = []` array every single frame by scanning the full `(2·renderDistance+1)²` chunk grid (`core/jardvoxel-survival-gameplay.js:468-479`), even though at steady state (player standing still, all nearby chunks already loaded) almost every iteration just `continue`s. At the default render distance (8) that's 289 iterations/frame; at the user-settable max (32) it's 4225 iterations/frame — done every frame regardless of whether anything actually changed, plus a fresh array allocation each time (GC pressure).

## Solution

Maintain a persistent "needs generation" queue/set instead of rebuilding it from scratch every frame. Only rescan when something actually changed:

1. Player crosses a chunk boundary (compare current chunk coord to last-checked chunk coord).
2. Render distance setting changes.
3. The queue empties out (nothing left to generate) — no need to rescan until one of the above triggers again.

On a chunk-boundary crossing, only scan the **delta ring** of newly-exposed chunk coordinates (the cells that entered the render-distance window but weren't in it before), not the full square again.

### Implementation Notes

1. Track `_lastPlayerChunkX`/`_lastPlayerChunkZ` (or reuse existing chunk-key tracking if present).
2. Replace the per-frame `toGen = []` allocation with a reusable array/Set cleared only on rescan, not every frame.
3. On rescan, compute only the newly-exposed ring using the delta between old and new player chunk coords + render distance (standard technique: for a square window sliding by (dx,dz), only the newly uncovered rows/columns need checking).
4. Apply SPEC-116's angle-based priority when inserting new candidates into the queue.
5. Keep the existing per-frame dispatch cap (1-2 chunks to `WorkerPool`) — this spec changes candidate *discovery*, not dispatch throughput.
6. Preserve exact same eventual chunk-loading behavior — this must be a pure performance refactor, not a behavior change (same chunks load, just discovered more cheaply).

## Acceptance Criteria

- [x] No `(2·rd+1)²` full-grid scan happens more than once per chunk-boundary crossing or render-distance change
- [x] No new array allocated per frame in steady state (reuse existing queue structure)
- [x] Chunk loading order/behavior unchanged from a player's perspective (same chunks load, same priority from SPEC-116)
- [ ] Verified via profiling: reduced scripting time and allocation count in `SurvivalWorld.update` (Chrome DevTools Performance + Memory panels, before/after)
- [x] No regression when rapidly changing render distance via settings slider (queue correctly rescans)

## Testing

- Manual playtest at render distance 32 (max), stand still for 10s, confirm via DevTools Performance panel that `update()` scripting cost drops to near-zero when no chunks are pending.
- Manual playtest: drag the render-distance slider up/down mid-game, confirm new chunks load correctly and old ones unload.
- Manual playtest: walk continuously in one direction, confirm no stutter or missed chunk loads compared to pre-change behavior.
- Existing `vitest` suite must still pass.

## Evidence (2026-07-10)

### Code Verification
- **Incremental queue implemented**: `SurvivalWorld` maintains `_chunkGenQueue` array with `_queueReadIdx` pointer
- **Chunk boundary tracking**: `_lastQueuePCX`, `_lastQueuePCZ`, `_lastQueueRD` fields track when rescan is needed
- **Delta-ring scanning**: Code only rescans when player crosses chunk boundary or render distance changes
- **Queue reuse**: No per-frame array allocation in steady state (queue is persistent)
- **SPEC-116 integration**: Queue uses `chunkGenPriority()` for angle-aware ordering

### Automated Test Coverage
- **Existing test file**: `tests/incremental-chunk-queue.test.js` (multiple tests)
- **Numeric key verification**: Tests confirm `_chunkKey()` produces numeric keys (no string allocation)
- **Queue persistence**: Tests verify queue is reused across frames
- **Boundary crossing**: Tests verify rescan only happens on chunk boundary crossing
- **Render distance change**: Tests verify queue rescans when render distance changes
- **Delta-ring logic**: Tests verify only newly-exposed chunks are added to queue

### Remaining Manual Verification Needed
- **Performance profiling**: DevTools Performance + Memory panel comparison (scripting time and allocation count at render distance 32) not yet measured
- **Steady-state verification**: Manual playtest standing still for 10s to confirm near-zero update cost not yet performed
