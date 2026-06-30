---
spec_id: SPEC-073
title: "Stylized Water Reflections"
priority: critical
estimated_time: 16h
depends_on: ["SPEC-070"]
status: pending
phase: 1
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-073: Stylized Water Reflections

## Description

Replace MeshLambertMaterial water with custom WaterMaterial shader featuring stylized reflections, enhanced Fresnel, refraction at shores, caustics, and simplified SSR.

## Requirements

### WaterMaterial (Custom Shader)
- Stylized reflection (sky color + block silhouettes, not realistic)
- Enhanced Fresnel effect (already partially implemented, improve)
- Subtle refraction at shorelines
- Caustics on underwater floor (animated pattern by depth)
- Simplified SSR (screen space, sky + nearby blocks only)

### Shader Uniforms
- `uTime`: animated waves and caustics
- `uSkyColor`: current sky color from sky dome
- `uSunDirection`: sun position for specular highlights
- `uCameraPos`: for Fresnel calculation
- `uReflectionMap`: render target with sky + blocks

### Implementation
- Use THREE.ShaderMaterial with custom vertex/fragment shaders
- Reflection render target: low resolution (256x256) updated every 4 frames
- Caustics: procedural pattern using sin/cos grids animated by time
- Refraction: distort UVs based on view angle and wave height

### Integration
- Replace water material in `jardvoxel-survival-mesher.js`
- Update uniforms in render loop
- Reflection RT render: sky dome + opaque blocks only

## Acceptance Criteria

- [ ] Custom WaterMaterial with stylized reflections
- [ ] Fresnel effect visible at grazing angles
- [ ] Refraction visible at shorelines
- [ ] Caustics animated on underwater floor
- [ ] Simplified SSR for sky + nearby blocks
- [ ] Water color matches biome palette
- [ ] No FPS impact >8%
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-water.js` (shader material)
- **Modify:** `core/jardvoxel-survival-mesher.js` (use new water material)
- **Modify:** `core/jardvoxel-survival-gameplay.js` (update uniforms in loop)
- **Create:** `tests/water.test.js`
