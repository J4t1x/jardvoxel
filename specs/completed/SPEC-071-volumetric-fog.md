---
spec_id: SPEC-071
title: "Volumetric Fog"
priority: critical
estimated_time: 10h
depends_on: ["SPEC-070"]
status: pending
phase: 1
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-071: Volumetric Fog

## Description

Replace THREE.Fog linear with atmospheric volumetric fog system. Density varies by biome, color matches sky dome gradient, height-based variation.

## Requirements

### VolumetricFog System
- Density per biome: desert 0.1, forest 0.3, ocean 0.2, cave 0.5, plains 0.15, mountains 0.05 (peak), swamp 0.4
- Color dynamic based on time of day (gradient with sky dome)
- Height variable: denser in valleys, clear on mountain peaks
- Cave fog: darkness with dust particles
- Village fog: chimney smoke, campfire heat

### Implementation
- Use THREE.FogExp2 with dynamic density/color updates
- Biome-based density interpolation at biome borders
- Height factor: density *= (1 - normalizedHeight * 0.7)
- Color lerps with sky dome dawn/day/sunset/night gradients
- Cave detection: if block above head is solid, use cave fog settings

### Integration
- Replace existing `this.scene.fog = new THREE.Fog(...)` in gameplay.js
- Update fog color in sky dome update cycle
- Update density when player crosses biome border

## Acceptance Criteria

- [ ] Fog visible on horizon as atmospheric layer
- [ ] Density varies by biome (desert clear, forest dense, cave very dense)
- [ ] Fog color matches sky gradient (dawn warm, night dark blue)
- [ ] Height variation: valleys foggy, peaks clear
- [ ] Cave fog with darkness effect
- [ ] No FPS impact >5%
- [ ] Smooth transitions at biome borders
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-fog.js`
- **Modify:** `core/jardvoxel-survival-gameplay.js` (replace fog, integrate updates)
- **Create:** `tests/fog.test.js`
