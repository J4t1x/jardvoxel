# SPEC-102: Region Generator — Level 3 Hierarchy

**Priority:** Critical  
**Estimate:** 1.5h  
**Depends on:** SPEC-101  
**Blocked by:** SPEC-101

## Description

Continents divide into large regions (mountain ranges, plains, forests, swamps, plateaus, coasts, deserts). Regions span hundreds of chunks and determine landscape character.

## Requirements

1. `RegionGenerator` class initialized from `ContinentGenerator`
2. Region types:
   - `mountain_range`, `plains`, `forest`, `swamp`, `plateau`, `coast`, `desert`, `tundra`, `jungle`, `volcanic`
3. Region boundaries from medium-frequency noise (scale ~0.001)
4. Per-region properties:
   - `type` — region type enum
   - `heightModifier` — altitude adjustment range
   - `biomeBias` — preferred biomes within region
   - `treeDensity` — vegetation multiplier
   - `waterFeatures` — lake/river probability
   - `landmarkChance` — probability of containing a landmark

5. `getRegion(x, z)` — returns region descriptor at any position
6. Region transitions blended over 4-8 chunks

## Acceptance Criteria

- [ ] Regions are deterministic from seed
- [ ] Region types match continent climate (no deserts in tundra continents)
- [ ] Transitions are smooth
- [ ] Mountain ranges form continuous chains (not isolated chunks)

## Implementation Notes

- Use `SimplexNoise` at scale 0.001 for region boundaries
- Region type selection weighted by continent properties
- Mountain ranges: use ridged noise for continuous chains
- Cache region lookups per chunk coordinate
