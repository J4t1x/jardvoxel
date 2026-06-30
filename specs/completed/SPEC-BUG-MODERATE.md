---
spec_id: SPEC-BUG-MODERATE
title: "Fix moderate bugs in JardVoxel — mud mapping, duplicate faces, isSolid inconsistency"
priority: high
estimated_time: 20min
status: pending
created_at: 2026-06-25
---

# SPEC-BUG-MODERATE: Fix Moderate Bugs in JardVoxel

## Requirements

Fix 3 moderate bugs affecting terrain correctness and performance.

## Bugs

### BUG-004: blockTypeToId missing 'mud' mapping
- **File:** `jardvoxel-survival-engine.js:498-511`
- **Issue:** Swamp surfaces become air (mud not in types mapping)
- **Fix:** Add 'mud': 8 to types mapping

### BUG-005: Duplicate faces in greedy meshing
- **File:** `jardvoxel-engine.js:1726-1737`
- **Issue:** AIR→solid neighbor creates duplicate back-facing faces
- **Fix:** Skip same-chunk AIR→solid cases, only keep cross-chunk

### BUG-006: VoxelChunk.isSolid doesn't exclude LAVA
- **File:** `jardvoxel-engine.js:1565-1568`
- **Issue:** Inconsistency with ChunkManager.isSolidAt
- **Fix:** Add LAVA exclusion to VoxelChunk.isSolid

## Acceptance Criteria

- [ ] 'mud' maps to a valid block ID in blockTypeToId
- [ ] Swamp biomes in minecraft-engine generate solid surfaces
- [ ] Greedy meshing skips same-chunk AIR→solid duplicate faces
- [ ] Cross-chunk boundary faces still render correctly
- [ ] VoxelChunk.isSolid excludes LAVA
- [ ] VoxelChunk.isSolid consistent with ChunkManager.isSolidAt
