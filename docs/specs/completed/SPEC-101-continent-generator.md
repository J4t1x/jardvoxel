# SPEC-101: Continent Generator — Level 2 Hierarchy

**Priority:** Critical  
**Estimate:** 1h  
**Depends on:** SPEC-100  
**Blocked by:** SPEC-100

## Description

Each continent gets unique identity: climate, altitude, humidity, vegetation, fauna, culture, resources. Continents span thousands of chunks and must feel distinct.

## Requirements

1. `ContinentGenerator` class initialized from `WorldIdentity`
2. Per-continent properties:
   - `dominantClimate` — temperature baseline offset
   - `averageAltitude` — base height multiplier
   - `humidityLevel` — humidity baseline offset
   - `dominantVegetation` — primary biome type
   - `dominantFauna` — mob spawn table
   - `ancientCulture` — lore tag for structures/names
   - `characteristicResources` — ore distribution modifiers

3. Continent boundaries use blended transitions (no hard borders)
4. `getContinentProperties(x, z)` — returns interpolated properties at any position

## Acceptance Criteria

- [ ] Each continent has distinct climate/altitude/humidity
- [ ] Transitions between continents are smooth (8-16 chunk blend)
- [ ] Properties are deterministic from seed
- [ ] No two continents share identical property sets

## Implementation Notes

- Continent ID from `WorldIdentity.getContinentId(x, z)`
- Each continent gets a sub-seed derived from world seed + continent index
- Properties generated once at init, stored in Map
- Boundary blending uses distance-to-edge calculation
