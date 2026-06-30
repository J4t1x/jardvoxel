---
spec_id: SPEC-075
title: "Biome Identity System"
priority: high
estimated_time: 10h
depends_on: []
status: pending
phase: 2
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-075: Biome Identity System

## Description

Each biome must be recognizable by silhouette, not just color. Implement "biome fingerprint" system with tree shape, vegetation density, rock type, climate, ambient sound, music mood, particles, and fauna.

## Requirements

### BiomeFingerprint
Each biome gets a fingerprint object:
- `treeShape`: silhouette profile (oak_round, pine_conical, mangrove_roots, dead_twisted, acacia_flat, cherry_sphere, mystic_mushroom, autumn_oak)
- `vegetationDensity`: sparse / normal / dense / very_dense
- `rockType`: boulders / scattered / cliffs / none
- `climate`: temperature + humidity (already exists, expose visually)
- `ambientSound`: birds / wind / insects / water / silence / crows
- `musicMood`: calm / mysterious / warm / eerie / epic
- `particles`: pollen / snowflakes / leaves / mist / dust / fireflies
- `fauna`: passive_mobs + hostile_mobs specific per biome

### New Biomes
- **Mystic Grove**: giant mushrooms, glowing spores, magical mood, lydian music
- **Autumn Forest**: orange/red leaves, falling leaves, melancholic mood, aeolian music

### Biome Transitions
- Smooth blend of fingerprints at borders (50/50 mix zone)
- Visual: tree types from both biomes in transition zone
- Audio: crossfade ambient sounds (2s)

## Acceptance Criteria

- [ ] BiomeFingerprint object for all 19 biomes (17 existing + 2 new)
- [ ] Mystic Grove biome generates correctly
- [ ] Autumn Forest biome generates correctly
- [ ] Tree shape varies by biome fingerprint
- [ ] Vegetation density matches fingerprint
- [ ] Smooth transitions at biome borders
- [ ] Each biome recognizable by silhouette at >100 blocks distance
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-biome-identity.js`
- **Modify:** `core/jardvoxel-survival-engine.js` (add new biomes, integrate fingerprints)
- **Create:** `tests/biome-identity.test.js`
