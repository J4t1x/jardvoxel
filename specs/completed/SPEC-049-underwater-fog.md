# SPEC-049: Underwater Fog + Visibility Overlay

## Priority: Medium
## Estimate: 2h
## Depends on: none

## Description

Add visual effects when the player's camera is submerged in water. Blue-green fog, reduced visibility, and subtle distortion for immersive underwater experience.

## Visual Effects

### Underwater Fog
- **Fog color**: Blue-green (0.1, 0.3, 0.4) when submerged
- **Fog density**: `THREE.FogExp2(0x1a4d66, 0.08)` — thick, can't see far
- **Normal fog**: Restore previous fog when not submerged
- **Transition**: Lerp fog color/density over 0.5s for smooth transition

### Screen Overlay
- **CSS overlay**: Semi-transparent blue div over entire screen when submerged
- **Color**: `rgba(20, 80, 120, 0.3)` — subtle blue tint
- **Transition**: Fade in/out over 0.3s

### Audio Effect
- **Low-pass filter**: Apply to AudioContext when submerged (muffled sound)
- **Frequency**: 800Hz cutoff when underwater, restore when above

### Caustics (optional, if time permits)
- **Animated light pattern**: Subtle moving light spots on underwater surfaces
- **Implementation**: Canvas texture with sine-based pattern, applied as overlay

## Detection

- **Check**: `ChunkManager.getBlock(camera.x, camera.y, camera.z) === BLOCKS.WATER`
- **Update**: Every frame in `animate()` before render
- **Store**: `this.player.inWater` already exists — reuse for camera check

## Acceptance Criteria

- [ ] Fog changes to blue-green when camera is underwater
- [ ] Fog density increases underwater (can't see >10 blocks)
- [ ] Blue screen overlay when underwater
- [ ] Smooth transition (lerp) when entering/exiting water
- [ ] Audio muffled when underwater (low-pass filter)
- [ ] Normal fog/vision restored when surfacing
- [ ] No console errors
- [ ] 60fps maintained

## Files to Modify

- `jardvoxel-survival.html` — Add underwater detection, fog swap, screen overlay, audio filter
