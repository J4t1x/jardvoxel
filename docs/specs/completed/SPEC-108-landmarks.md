# SPEC-108: Landmarks System

**Priority:** Medium  
**Estimate:** 1h  
**Depends on:** SPEC-102, SPEC-103  
**Blocked by:** SPEC-103

## Description

Each region can contain unique points of interest (landmarks) that serve as visual references during exploration.

## Requirements

1. `LandmarkSystem` class:
   - `tryPlaceLandmark(cx, cz, region, zone)` — deterministic placement
   - `getLandmark(x, z)` — returns nearest landmark or null
   - `landmarks` — Map of all placed landmarks

2. Landmark types:
   - `ancient_tree` — massive tree (5x5 trunk, height 20-30)
   - `grand_waterfall` — multi-block waterfall from high terrain
   - `volcano` — cone with lava lake
   - `crystal_lake` — clear water lake with special blocks
   - `canyon` — deep gorge through terrain
   - `stone_arch` — natural arch formation
   - `red_forest` — grove of unique red-leaved trees
   - `ancient_ruins` — partial stone structures
   - `natural_shrine` — serene meditation spot

3. Placement rules:
   - One landmark per region max
   - Must match region/zone type (volcano only in volcanic regions, etc.)
   - Probability: 40% per region
   - Position: deterministic from region seed

4. Landmarks generate during chunk generation (layer 4-6)

## Acceptance Criteria

- [ ] Landmarks are deterministic from seed
- [ ] Landmarks match region type
- [ ] Max one landmark per region
- [ ] Landmarks are visually distinct from normal terrain
- [ ] Landmarks integrate with wellness system (shrine = meditation spot)

## Implementation Notes

- Region seed: `worldSeed + continentId * 1000 + regionHash`
- Landmark placement: hash region center, check probability
- Generation: custom per-type function, called during chunk gen
- Some landmarks span multiple chunks (ancient_tree = 1 chunk, canyon = 3-5 chunks)
