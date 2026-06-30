---
spec_id: SPEC-074
title: "Interior Lighting"
priority: critical
estimated_time: 14h
depends_on: ["SPEC-070"]
status: pending
phase: 1
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-074: Interior Lighting

## Description

Detect when player is under a roof, reduce ambient light, increase contrast. Torches/campfires emit warm PointLight. Windows let directional light through. Village campfires visible at distance.

## Requirements

### Interior Detection
- Check if solid block exists above player head (2-5 blocks up)
- If under roof: reduce ambient light by 40%, increase contrast
- Smooth transition (lerp over 0.5s) when entering/exiting interiors

### Light Sources
- Torches: warm PointLight (color 0xFFA040, intensity 1.5, distance 8) — already have pool of 8
- Campfires: warm PointLight (color 0xFFC060, intensity 2.5, distance 12)
- Village campfires: visible at distance (increase distance to 32 when player is outside)
- Lanterns: warm glow (color 0xFFB050, intensity 1.0, distance 6)

### Window Lighting
- Raycast simplified: check if directional light path is blocked
- If window (glass block) in ceiling/wall: let partial directional light through
- Light shafts through windows (optional, via sprite or beam geometry)

### Dynamic Light Pool
- Maintain existing 8-light pool
- Prioritize: player torch > nearest campfire > nearest village light > other torches
- Smooth fade in/out when lights enter/leave range

## Acceptance Criteria

- [ ] Interior detection (block above head check)
- [ ] Ambient light reduced 40% indoors, smooth transition
- [ ] Torches emit warm PointLight (pool of 8 maintained)
- [ ] Campfires emit stronger warm light
- [ ] Village campfires visible from distance
- [ ] Window lighting (partial directional through glass)
- [ ] Light prioritization works (player torch > campfire > village)
- [ ] No FPS impact >5%
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-interior-lighting.js`
- **Modify:** `core/jardvoxel-survival-gameplay.js` (integrate interior detection + light pool)
- **Create:** `tests/interior-lighting.test.js`
