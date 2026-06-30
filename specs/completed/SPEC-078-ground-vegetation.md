---
spec_id: SPEC-078
title: "Ground Vegetation"
priority: high
estimated_time: 10h
depends_on: ["SPEC-075"]
status: pending
phase: 2
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-078: Ground Vegetation

## Description

Expand ground vegetation: tall grass with sway, flowers (8 types per biome), ferns, mushrooms, berry bushes, vines, lily pads, dead bushes, coral fans.

## Requirements

### Vegetation Types
- **Tall grass**: already exists, improve with sway animation (wind-based)
- **Flowers**: 8 types per biome, already partially implemented, expand
- **Ferns**: dense forests only
- **Mushrooms**: dark forests + mystic grove
- **Berry bushes**: edible, decoration
- **Vines**: caves, jungle trees
- **Lily pads**: swamp, still water
- **Dead bushes**: desert, badlands
- **Coral fans**: ocean, reefs

### Sway Animation
- Tall grass and flowers sway with wind direction
- Wind from weather system, fallback gentle breeze
- Sway via vertex shader offset (not CPU animation)
- Stronger sway during storms

### Implementation
- Add new block types to blocks-registry.js
- Generation in `jardvoxel-survival-features.js` ground decoration pass
- Sway shader: modify existing plant block materials

## Acceptance Criteria

- [ ] 9 vegetation types implemented
- [ ] Tall grass sways with wind
- [ ] Flowers sways with wind
- [ ] 8 flower types per biome
- [ ] Berry bushes are edible
- [ ] Vines generate in caves and jungle trees
- [ ] Lily pads on swamp water
- [ ] Coral fans in ocean reefs
- [ ] No FPS impact >2%
- [ ] No console errors

## Files to Modify

- **Modify:** `core/blocks-registry.js` (new block types)
- **Modify:** `core/jardvoxel-survival-features.js` (generation)
- **Create:** `tests/ground-vegetation.test.js`
