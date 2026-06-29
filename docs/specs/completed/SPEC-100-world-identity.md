# SPEC-100: World Identity — Level 1 Hierarchy

**Priority:** Critical  
**Estimate:** 1h  
**Depends on:** None (foundation)  
**Blocked by:** None

## Description

Implement the top-level `WorldIdentity` class that defines the global identity of the planet. This is the root of the 6-level hierarchy and remains constant during the entire playthrough.

## Requirements

1. `WorldIdentity` class with:
   - `seed` — main world seed (passed from game init)
   - `seaLevel` — global sea level (default: 63)
   - `geologicalAge` — affects terrain roughness (young=jagged, old=smooth)
   - `climateOffset` — global temperature shift (-0.2 to +0.2)
   - `oceanCoverage` — target fraction of world that is ocean (0.3 to 0.7)
   - `continentCount` — number of major continents (2-6)
   - `worldHistory` — array of geological events (volcanic era, ice age, etc.)
   - `continentMap` — low-res 2D noise map defining continent positions

2. Continent distribution using existing `SimplexNoise` at very low frequency:
   - Scale: 0.0001 (continent-scale features)
   - Threshold based on `oceanCoverage`
   - Domain warped for organic coastlines

3. `getContinentId(x, z)` — returns continent index for any world position
4. `getContinentData(x, z)` — returns full continent descriptor

## Acceptance Criteria

- [ ] `WorldIdentity` constructor accepts seed and optional parameters
- [ ] `getContinentId(x, z)` returns consistent continent IDs across calls
- [ ] Continent count and positions are deterministic from seed
- [ ] Ocean coverage matches configured target ±5%
- [ ] No circular dependencies with existing engine code
- [ ] Exports cleanly as ES module

## Implementation Notes

- Use existing `SimplexNoise` from `jardvoxel-survival-noise.js`
- Use existing `DomainWarper` for coastline organic shapes
- Cache continent lookups (Map with x,z key)
- Geological age modulates erosion noise amplitude globally
