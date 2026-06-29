# SPEC-105: Microsector Generator — Level 6

**Priority:** High  
**Estimate:** 1h  
**Depends on:** SPEC-104  
**Blocked by:** SPEC-104

## Description

Each chunk divides internally into microsectors (4x4 or 8x8) for fine-grained decoration: flowers, bushes, rocks, mushrooms, moss, branches, leaves, small elevation changes.

## Requirements

1. `MicrosectorGenerator` class:
   - `generateMicrosectors(chunk, context)` — fills micro-detail per sector
   - Sector size: 4x4 (16 sectors per chunk)
   - Each sector gets a `MicrosectorProfile`:
     - `decorationType`: flowers, bushes, rocks, mushrooms, moss, branches, leaves, none
     - `density`: 0-1 multiplier
     - `elevationNoise`: small ±1 block height variation

2. Decoration selection based on:
   - Zone type (meadow → flowers, forest → mushrooms/moss, desert → rocks)
   - Biome blend weights
   - Local humidity/temperature from hierarchy
   - Deterministic hash per sector

3. Micro elevation: ±1 block on surface for natural unevenness

## Acceptance Criteria

- [ ] Microsectors produce visually richer terrain
- [ ] Decoration is deterministic from seed
- [ ] No performance regression (microsector gen < 2ms per chunk)
- [ ] Decoration respects biome (no flowers in desert, no cactus in tundra)

## Implementation Notes

- 4x4 grid = 16 sectors, each evaluated once
- Use existing block types (FLOWER_RED, FLOWER_YELLOW, TALL_GRASS, FERN, etc.)
- Elevation noise: small SimplexNoise at scale 0.05, amplitude 1
- Sector hash: `hash(cx, cz, sx, sz)` for deterministic decoration
