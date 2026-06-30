---
spec_id: SPEC-079
title: "Forest Canopy System"
priority: high
estimated_time: 11h
depends_on: ["SPEC-077"]
status: pending
phase: 2
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-079: Forest Canopy System

## Description

Dense forests with overlapping tree crowns forming canopy. Under canopy: reduced light, light fog, dust particles. Natural paths between trees. Irregular forest profile.

## Requirements

### Canopy Generation
- Forest biomes: trees generate closer together (density multiplier 1.5x)
- Tree crowns overlap forming continuous canopy
- Different tree heights create irregular forest profile
- Natural paths: gaps in vegetation between tree clusters (2-3 block wide)

### Under-Canopy Effects
- Light reduced 30% under canopy (ambient occlusion boost)
- Light fog (density 0.15) under canopy
- Dust particles (subtle, 20 particles per chunk)
- Visibility: sky blocked by canopy, darker forest floor

### Implementation
- Modify forest tree placement in `jardvoxel-survival-features.js`
- Canopy detection: check if tree blocks above within 8 blocks
- Apply under-canopy effects in lighting/fog update

## Acceptance Criteria

- [ ] Forest trees generate denser with overlapping crowns
- [ ] Canopy blocks sky visibility
- [ ] Light reduced 30% under canopy
- [ ] Light fog under canopy
- [ ] Dust particles under canopy
- [ ] Natural paths between tree clusters
- [ ] Irregular forest profile (varied heights)
- [ ] No FPS impact >3%
- [ ] No console errors

## Files to Modify

- **Modify:** `core/jardvoxel-survival-features.js` (forest tree placement)
- **Modify:** `core/jardvoxel-survival-gameplay.js` (canopy detection + effects)
- **Create:** `tests/forest-canopy.test.js`
