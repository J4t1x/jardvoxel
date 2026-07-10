# SPEC-107: Intelligent Streaming — 4-Tier LOD

**Priority:** Medium  
**Estimate:** 1h  
**Depends on:** SPEC-104  
**Blocked by:** SPEC-104

**Status:** ⚠️ Superseded by SPEC-120 (StreamingManager was dead code — never integrated, removed)

## Description

Replace current 5-level LOD with 4-tier streaming aligned with the v7.0 hierarchy and layer system.

## Requirements

1. Four streaming tiers:

| Tier | Distance | Content |
|------|----------|---------|
| Near | 0-3 chunks | All 9 layers, full meshes, shadows, fauna |
| Medium | 3-8 chunks | Layers 1-6, simplified trees, no fauna |
| Far | 8-14 chunks | Layers 1-2 only, basic geometry |
| Horizon | 14+ chunks | Heightmap representation only (no mesh) |

2. `StreamingManager` class:
   - `update(playerX, playerZ, camera)` — manages tier transitions
   - `promoteChunk(cx, cz)` — upgrade tier (add layers)
   - `demoteChunk(cx, cz)` — downgrade tier (remove layers, simplify mesh)
   - Smooth transitions (no pop-in for geometry)

3. Integration with existing `ChunkManager`:
   - Replace `_getLODLevel()` with tier system
   - Near: full mesh + water + shadows
   - Medium: full mesh + simplified water
   - Far: merged geometry (2x2 block merge)
   - Horizon: heightmap billboard or skip entirely

## Acceptance Criteria

- [ ] 4 tiers work correctly
- [ ] Tier transitions are smooth (no visible popping)
- [ ] Distant chunks use less memory than v6.0
- [ ] FPS impact is equal or better than v6.0

## SPEC-120 Audit Result

**Decision: Removed.** The `StreamingManager` class was built but never integrated into the live rendering pipeline. No core file imported it; the `_streamingManager` reference in `jardvoxel-zen-game.js` was a dead conditional (always falsy). The 5-level LOD in `jardvoxel-survival-gameplay.js` remained the live system. `core/jardvoxel-survival-streaming.js` was deleted, orphaned references cleaned up, and tests updated.

## Implementation Notes

- Reuse existing LOD mesh building from `jardvoxel-engine.js`
- Far tier: use existing 2x2 merge from `_getLODLevel` level 2
- Horizon: could use a simple heightmap-colored plane
- Tier promotion: add layers progressively, rebuild mesh
- Tier demotion: dispose detailed mesh, build simplified one
