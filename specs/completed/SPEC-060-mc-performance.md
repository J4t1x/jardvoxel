# SPEC-060: Minecraft Variant — Performance

## Priority: Medium
## Estimated: 2h
## Depends on: —

## Problem
No adaptive render distance or dynamic lighting for emissive blocks.

## Requirements

### 1. Adaptive Render Distance
- Track FPS in `MinecraftWorld.update()`
- If FPS < 30, reduce render distance by 1 (min 2)
- If FPS > 55, restore toward target render distance
- `_targetRenderDist` preserves user setting as upper bound
- `_adaptiveEnabled` flag to toggle

### 2. Dynamic Point Lights
- Up to 4 `THREE.PointLight` instances managed dynamically
- Scan nearby blocks (8-block radius, step 2) for torches, lanterns, lava
- Sort by distance, assign closest 4 to lights
- Throttle scan to every 0.3s
- Torch/lantern: warm orange (0xffaa44), intensity 1.0
- Lava: red-orange (0xff4400), intensity 1.5
- Range 8, decay 2

## Acceptance Criteria
- [x] Render distance auto-reduces when FPS drops below 30
- [x] Render distance restores when FPS recovers
- [x] Torches and lanterns cast dynamic point light
- [x] Lava casts red-orange point light
- [x] Max 4 simultaneous point lights (performance)
- [x] Point light scan is throttled (not every frame)
- [x] No console errors
