---
spec_id: SPEC-084
title: "Ambient Sound System"
priority: medium
estimated_time: 12h
depends_on: []
status: pending
phase: 4
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-084: Ambient Sound System

## Description

Biome-specific ambient sounds using Web Audio API with procedural buffers. 3D positional audio for localized sounds. Crossfade between biomes.

## Requirements

### Ambient Sounds per Biome
- Plains: birds (3 types), gentle wind, insects
- Forest: birds (5 types), leaves rustling, distant animals
- Desert: strong wind, sand shifting, occasional hawk
- Mountains: strong wind, eagle cry, rock falling
- Swamp: frogs, insects, water dripping, crows
- Ocean: waves, seagulls, underwater muffled
- Caves: dripping water, echoes, rock creaking
- Mystic Grove: chimes, ethereal whispers, glowing sounds
- Village: chatter, hammering, laughter, fire crackling
- Nether: ambient drone, lava bubbling, distant screams

### Implementation
- Web Audio API with pre-generated procedural buffers (no audio files)
- 3D positional audio (PannerNode) for localized sounds
- Crossfade between biomes (2s transition)
- Volume adjustable independently from music
- Sound sources: ambient (omnidirectional) + point (localized)

## Acceptance Criteria

- [ ] All 10 biome ambient sound profiles implemented
- [ ] Procedural audio (no external files)
- [ ] 3D positional audio for point sources
- [ ] Crossfade between biomes (2s)
- [ ] Volume independent from music
- [ ] No audio glitches
- [ ] No console errors

## Files to Create

- **Create:** `core/jardvoxel-survival-ambient-sound.js`
- **Create:** `tests/ambient-sound.test.js`
