# SPEC-057: Minecraft Variant — Visual Parity

## Priority: High
## Estimated: 4h
## Depends on: —

## Problem
The `jardvoxel-survival.html` variant lacks visual features that were implemented in the original `jardvoxel.html` engine (SPEC-025, 026, 027, 032). The minecraft variant has:
- Basic sun/moon meshes but no stars, sky dome gradient, or sunset colors
- No procedural clouds
- No water wave animation or depth-based color
- No ambient occlusion or color variation in the mesher

## Requirements

### 1. Sky Overhaul (port from SPEC-026)
- Star field (~800 THREE.Points on a hemisphere, fade with dayFactor)
- Sky dome gradient (ShaderMaterial, top/bottom color interpolation)
- Sunset/sunrise color interpolation (orange #ff7a3d)
- Dynamic fog color following horizon
- Sky dome follows player position

### 2. Water Animation (port from SPEC-027)
- Wave animation: two superimposed sine waves on water mesh vertices
- Depth-based color: shallow turquoise → deep blue
- Coastline color boost when block below is sand/sandstone
- Recompute vertex normals each frame for correct lighting

### 3. Procedural Clouds (port from SPEC-032)
- Canvas 256x256 with multi-octave noise
- 3 planes at altitudes 55, 58, 61 for volumetric effect
- Wind movement via texture offset
- Dynamic color: white → pink sunset → grey night
- Opacity variable with dayFactor

### 4. AO + Color Variation (port from SPEC-025)
- Ambient occlusion: darken vertices with more solid neighbors
- Color variation by position: hash(x,y,z) * ±5% for organic texture
- Grass block face differentiation (top=green, sides=dirt+green border, bottom=dirt)

## Acceptance Criteria
- [ ] Stars visible at night, fade during day
- [ ] Sky gradient visible (horizon lighter than zenith)
- [ ] Sunset/sunrise shows orange/pink tones
- [ ] Water surface has animated waves
- [ ] Water color varies by depth (shallow=turquoise, deep=blue)
- [ ] Clouds visible with wind movement
- [ ] AO visible in corners and under overhangs
- [ ] Block colors have subtle variation (not flat uniform)
- [ ] Grass block has different colors per face
- [ ] 60fps target with RENDER_DIST=3
- [ ] No console errors
