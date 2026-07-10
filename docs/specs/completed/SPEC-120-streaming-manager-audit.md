# SPEC-120: Audit and Resolve StreamingManager (v7.0 4-Tier System)

**Priority**: Medium
**Estimated effort**: 4h
**Files affected**: `core/jardvoxel-survival-streaming.js`, `core/jardvoxel-survival-layers.js`, `core/jardvoxel-survival-gameplay.js`, `docs/specs/completed/SPEC-107-streaming.md`, `docs/specs/completed/README.md`
**Depends on**: none
**Status**: ✅ Completed — Decision: Removed

## Problem

`SPEC-107-streaming.md` (marked ✅ Completado) describes a `StreamingManager` class implementing a 4-tier system (Near/Medium/Far/Horizon) meant to **replace** the current 5-level mesh LOD. A grep across `core/` for `StreamingManager` usage from `SurvivalWorld`/`ZenGame` found no call site — the class appeared to exist as standalone, unintegrated infrastructure alongside the 5-level LOD system that is actually live.

## Investigation Evidence

### Grep Results (before removal)

**`StreamingManager` references in `core/`:**
- `jardvoxel-survival-streaming.js:32` — class definition
- `jardvoxel-zen-game.js:260-261` — dead conditional: `if (this.world.generator.hierarchy._streamingManager)` — `_streamingManager` is never assigned on hierarchy, so this always evaluates to `false`

**`StreamingManager` references in `tests/`:**
- `archipelago-polish.test.js` — 5 unit tests with mock objects (`new StreamingManager({}, {})`)
- `garden-launch.test.js` — 2 unit tests with mock objects

**`import` statements for `jardvoxel-survival-streaming.js` in `core/`:**
- **Zero.** No core file imports the streaming module.

**`_streamingManager` assignment anywhere:**
- **Never.** The property is checked but never set.

**Live LOD system:**
- `jardvoxel-survival-gameplay.js:276-286` — 5-level LOD (0-4) with Euclidean distance thresholds at 6, 12, 20, 32 chunks
- `jardvoxel-survival-gameplay.js:642-670` — throttled LOD re-meshing in `update()`

### Conclusion

`StreamingManager` is **confirmed dead code**. The class was built as part of SPEC-107 but never integrated into the live rendering pipeline. It only classifies chunks into tiers but doesn't act on them — `update()` returns `{ upgrades, downgrades }` arrays but no consumer processes them. The 5-level LOD in `gameplay.js` is the sole live system.

## Decision: Removed

**Rationale:**
1. No core file imports `StreamingManager` — it's completely disconnected from the rendering pipeline
2. The `_streamingManager` reference in `jardvoxel-zen-game.js` is a dead conditional (always falsy)
3. `StreamingManager` only classifies tiers but doesn't build meshes or manage geometry — integrating it would require substantial new code beyond this spec's scope
4. The 5-level LOD in `gameplay.js` works and is the live system
5. Tests were testing dead code in isolation with mock objects — not integration tests

## Actions Taken

1. **Deleted** `core/jardvoxel-survival-streaming.js`
2. **Removed** dead `_streamingManager` conditional in `jardvoxel-zen-game.js:259-262`
3. **Removed** `StreamingManager` import and 5 tests from `tests/archipelago-polish.test.js`
4. **Removed** `StreamingManager` import and 2 tests from `tests/garden-launch.test.js`
5. **Updated** `docs/specs/completed/SPEC-107-streaming.md` — marked as superseded with audit result
6. **Updated** `docs/specs/completed/README.md` — SPEC-107 status changed to "⚠️ Superseded by SPEC-120"
7. **Updated** `core/README.md` — removed streaming.js entry
8. **Updated** `docs/README.md` — removed streaming.js from file tree
9. **Updated** `docs/WORLD-GENERATION.md` — removed streaming.js from v7.0 files table

## Post-removal Verification

- `grep -rn "streaming" core/ tests/` — **0 results** (confirmed clean)
- `npx vitest run` — **924 passed, 6 failed** (all 6 failures are pre-existing `ai-server.test.js` WebSocket issues, unrelated to this change)
- All modified test files (`archipelago-polish.test.js`, `garden-launch.test.js`) pass
- No orphaned imports/exports remain

## Acceptance Criteria

- [x] Definitive grep/trace evidence recorded — `StreamingManager` was never referenced in the live Zen path
- [x] Explicit decision documented: **removed**
- [x] No orphaned imports/exports remain — `grep -r "streaming" core/` returns 0 hits
- [x] N/A (not integrated — old 5-level LOD remains live, untouched)
- [x] `SPEC-107-streaming.md` status and `docs/specs/completed/README.md` corrected
- [x] No regression — 924/930 tests pass (6 pre-existing ai-server failures unrelated)
