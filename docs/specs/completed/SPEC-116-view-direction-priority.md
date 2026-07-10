# SPEC-116: Wire View-Direction Chunk Prioritization into SurvivalWorld

**Priority**: High
**Estimated effort**: 4h
**Files affected**: `core/jardvoxel-survival-gameplay.js`
**Depends on**: none

## Problem

`PRD-CHUNK-OPTIMIZATION.md` claims view-direction chunk loading (priorize lo que está frente a la cámara) is ✅ Completado, and the diagnosis in that PRD (~40% CPU wasted generating/meshing chunks never seen) motivated the whole effort. In reality, this logic only exists in the legacy `jardvoxel-engine.js` (`:2402-2449`), which Zen does not use.

In the live path (`core/jardvoxel-survival-gameplay.js:454-479`), `cameraYaw` is computed but never applied — the generation loop (`:468-479`) sorts candidates purely by radial distance. Zen currently generates, meshes, and keeps loaded chunks directly behind the player at the same priority as chunks in front, which is exactly the "no renderizar lo que no se ve" problem the user flagged.

## Solution

Add an angular term to the chunk-generation priority key so that chunks within the camera's forward view cone are generated/meshed before chunks in the rear arc, at equal distance. Do **not** skip rear chunks entirely — the player can turn around — but push them to the back of the queue so the CPU/worker budget goes to what's actually visible first.

Port the angle-weighting approach already proven in `jardvoxel-engine.js:2402-2449` (front/side/back arc classification) to the survival engine's chunk-key system (numeric keys, not string keys — see SPEC-PERF-001).

### Implementation Notes

1. In the `toGen` build loop (`gameplay.js:468-479`), compute the angle between `(chunkCenter - playerPos)` and the camera forward vector (`cameraYaw` already available at `:454-462`).
2. Classify into arcs (e.g. front ±60°, side, rear) or use a continuous cosine-based weight — prefer continuous weight to avoid hard pop-in at arc boundaries.
3. Sort `toGen` by a composite key: `distance - angleWeight * K` (tune `K` so angle only breaks ties within a reasonable distance band, not override distance entirely — a very close rear chunk should still beat a far front chunk).
4. Keep the existing dispatch cap (1-2 chunks/frame to `WorkerPool`) unchanged — this spec only changes ordering, not throughput.
5. Do not change chunk *unloading* logic — only generation/meshing priority.

## Acceptance Criteria

- [x] Chunks within the forward view cone are dispatched to the worker before same-distance chunks in the rear arc
- [x] `toGen` sort combines distance and view angle (not pure radial distance)
- [x] Chunks behind the player still eventually load (no permanent holes when the player turns around)
- [x] No change to unload/eviction logic
- [ ] Measured: walking in a straight line at render distance 16, chunk-gen/mesh CPU time per frame is reduced vs. baseline (use `performance.now()` around the dispatch call or the existing FPS counter)

## Testing

- Manual playtest: walk in a straight line at render distance 16, compare Chrome DevTools Performance panel (scripting time in `SurvivalWorld.update`) before/after.
- Manual playtest: turn 180° repeatedly near a chunk boundary, confirm no missing chunks or visible holes behind the player after a few seconds.
- Existing `tests/` suite (`vitest`) must still pass — no unit test currently covers this loop directly; consider adding one for the sort/priority function if it's extracted as a pure function.

## Evidence (2026-07-10)

### Code Verification
- **Priority function implemented**: `chunkGenPriority()` exported from `jardvoxel-survival-gameplay.js`
- **Angle-based weighting confirmed**: Function computes `distance - cos(angle) * K` where K=1.5 (default)
- **Camera yaw integration**: Function accepts `cameraYaw` parameter and uses it to compute view angle
- **Close-chunk optimization**: Chunks within distance ≤1.5 use raw distance (no angle penalty)
- **Continuous weighting**: Uses cosine for smooth priority gradient (no hard arc boundaries)

### Automated Test Coverage
- **Existing test file**: `tests/chunk-priority.test.js` (8 tests, all passing)
- **Front vs rear verification**: Tests confirm front chunks get lower priority values (higher precedence) than rear chunks at equal distance
- **Camera yaw respect**: Tests verify priority changes correctly when camera direction changes
- **Distance dominance**: Tests confirm close rear chunks still beat far front chunks
- **Continuous weight**: Tests verify no hard discontinuity at arc boundaries
- **K-factor tuning**: Tests verify front/rear priority difference is 2*K at equal distance

### Remaining Manual Verification Needed
- **Performance measurement**: DevTools Performance panel comparison (scripting time in `SurvivalWorld.update`) at render distance 16 not yet measured
- **Visual playtest**: 180° turn test for rear chunk loading not yet performed
