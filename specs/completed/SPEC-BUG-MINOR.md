---
spec_id: SPEC-BUG-MINOR
title: "Fix minor bugs in JardVoxel — spline tangents, key conflict, vegetation logic, noise optimization"
priority: medium
estimated_time: 15min
status: pending
created_at: 2026-06-25
---

# SPEC-BUG-MINOR: Fix Minor Bugs in JardVoxel

## Requirements

Fix 4 minor bugs affecting polish and performance.

## Bugs

### BUG-007: Spline.evaluate uses zero tangents
- **File:** `jardvoxel-survival-engine.js:130`
- **Issue:** Cubic hermite has hardcoded 0 tangents — effectively smoothstep
- **Fix:** Compute tangents from neighboring spline points

### BUG-008: Flying + ShiftLeft key conflict
- **File:** `jardvoxel.html:718, 744-745`
- **Issue:** ShiftLeft both speeds up and descends when flying
- **Fix:** Use different key for descend or only apply run speed when not flying

### BUG-009: getVegetationAt redundant flower check
- **File:** `jardvoxel-engine.js:782-793`
- **Issue:** Redundant FLOWER_RED check for plains (unreachable code)
- **Fix:** Remove redundant line 793

### BUG-010: Survival engine uses 3D noise for 2D
- **File:** `jardvoxel-survival-engine.js:239-251`
- **Issue:** fbm3D(x, 0, z) wastes compute on 3D gradient for 2D noise
- **Fix:** Add noise2D method or cache biome results

## Acceptance Criteria

- [ ] Spline.evaluate computes tangents from neighboring points
- [ ] Flying + ShiftLeft no longer causes simultaneous descend
- [ ] Redundant vegetation check removed
- [ ] Survival engine uses 2D noise for 2D operations or caches results
