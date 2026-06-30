---
spec_id: SPEC-076
title: "Biome Ambient Particles"
priority: high
estimated_time: 8h
depends_on: ["SPEC-075"]
status: pending
phase: 2
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-076: Biome Ambient Particles

## Description

Ambient particle systems per biome: pollen, snowflakes, fireflies, dust, glowing spores, falling leaves, petals, bioluminescence, dust motes.

## Requirements

### Particle Systems per Biome
- Plains: pollen (yellow, slow, 50 particles)
- Forest: leaves falling (green/yellow, 80 particles)
- Taiga: snowflakes (white, 100 particles)
- Swamp: fireflies (green-yellow, glowing, 40 particles)
- Desert: dust (sand color, 60 particles)
- Mystic Grove: glowing spores (purple, 70 particles)
- Autumn Forest: falling leaves (orange/red, 90 particles)
- Cherry Grove: petals (pink, 80 particles)
- Ocean (night): bioluminescence (blue, 60 particles)
- Caves: dust motes (gray, 30 particles)

### Implementation
- Use THREE.Points with custom shader material
- Particle pool: reuse geometry, update positions in update()
- Particles follow player (centered on player position, radius 32 blocks)
- Particles drift with wind direction (from weather system)
- LOD: reduce particle count with distance from player
- Night-only particles (fireflies, bioluminescence) only render at night

## Acceptance Criteria

- [ ] All 10 particle types implemented
- [ ] Particles centered on player position
- [ ] Wind affects particle drift
- [ ] Night-only particles only render at night
- [ ] LOD reduces particle count at distance
- [ ] No FPS impact >3%
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-ambient-particles.js`
- **Modify:** `core/jardvoxel-survival-gameplay.js` (integrate particle update in loop)
- **Create:** `tests/ambient-particles.test.js`
