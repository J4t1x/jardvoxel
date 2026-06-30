---
spec_id: SPEC-077
title: "Tree Personality System"
priority: high
estimated_time: 16h
depends_on: ["SPEC-075"]
status: pending
phase: 2
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-077: Tree Personality System

## Description

Replace 6 generic tree types with parametric system: 10 tree types with age, health, and variation parameters. Each tree has unique silhouette.

## Requirements

### Tree Types (10)
1. **Oak**: trunk 3-5m, rounded asymmetric crown, age variable (young/old)
2. **Pine**: trunk 5-12m, conical crown with spiral branches
3. **Mangrove**: visible roots (3-5 blocks), inclined trunk, dispersed crown
4. **Dead**: no leaves, twisted branches, dark bark
5. **Savanna (Acacia)**: thick short trunk, flat wide crown
6. **Giant** (rare <0.1%): trunk 4x4, height 20-30m, massive crown
7. **Birch**: white thin trunk, small rounded crown
8. **Cherry**: thin trunk, pink spherical crown
9. **Mystic Mushroom**: giant 8-15m, colorful cap
10. **Autumn Oak**: like oak but orange/red leaves

### Parameters per Tree
- `age`: young (smaller, lighter crown) → old (bigger, denser crown)
- `health`: alive (full leaves) → dying (sparse leaves) → dead (no leaves)
- `variation`: random rotation, crown asymmetry, branch count

### Implementation
- Replace existing tree generation in `jardvoxel-survival-features.js`
- Each tree type: parametric generator function
- Age/health/variation determined by position hash + biome
- Giant trees: very rare, special generation check

## Acceptance Criteria

- [ ] 10 tree types with unique silhouettes
- [ ] Age parameter affects size and crown density
- [ ] Health parameter affects leaf coverage
- [ ] Variation parameter adds asymmetry
- [ ] Giant trees spawn <0.1% of the time
- [ ] Trees match biome fingerprint
- [ ] No console errors

## Files to Modify

- **Modify:** `core/jardvoxel-survival-features.js` (replace tree generation)
- **Create:** `tests/tree-personality.test.js`
