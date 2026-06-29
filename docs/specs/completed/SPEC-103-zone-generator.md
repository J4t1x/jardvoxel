# SPEC-103: Zone Generator — Level 4 Hierarchy

**Priority:** Critical  
**Estimate:** 1.5h  
**Depends on:** SPEC-102  
**Blocked by:** SPEC-102

## Description

Regions subdivide into zones (lakes, valleys, waterfalls, dense forests, clearings, hills, cliffs, wetlands). Zones span tens of chunks and create the places players perceive as unique.

## Requirements

1. `ZoneGenerator` class initialized from `RegionGenerator`
2. Zone types:
   - `lake`, `valley`, `waterfall`, `dense_forest`, `clearing`, `hills`, `cliffs`, `wetlands`, `river_bend`, `gorge`, `meadow`, `grove`
3. Zone boundaries from higher-frequency noise (scale ~0.005)
4. Per-zone properties:
   - `type` — zone type enum
   - `size` — approximate chunk count
   - `featureList` — specific features to generate (e.g., waterfall = requires height diff + water)
   - `moodTag` — emotional descriptor (serene, mysterious, grand, cozy)
   - `microDetail` — decoration density multiplier

5. `getZone(x, z)` — returns zone descriptor
6. Zone transitions blended over 2-4 chunks

## Acceptance Criteria

- [ ] Zones are deterministic from seed
- [ ] Zone types are valid for parent region (no lakes in deserts unless oasis)
- [ ] Waterfalls only generate where height difference exists
- [ ] Each zone has a mood tag for wellness system integration

## Implementation Notes

- Use `SimplexNoise` at scale 0.005 for zone boundaries
- Zone type weighted by region type + continent humidity
- Some zones require terrain pre-check (waterfall needs height diff)
- Mood tags integrate with SPEC-099 wellness system
