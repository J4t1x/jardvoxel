# SPEC-110: Contextual Structure Generation

**Priority:** Medium  
**Estimate:** 1h  
**Depends on:** SPEC-102, SPEC-103  
**Blocked by:** SPEC-103

## Description

Structures use geographic information to decide placement. Villages near rivers, mines near mountains, temples on elevated terrain, ports near bays.

## Requirements

1. `ContextualStructureSystem` class:
   - `tryPlaceStructure(cx, cz, context)` — checks if structure should generate
   - Uses `ChunkContext` (continent, region, zone, biome, height) for decisions

2. Placement rules:

| Structure | Required Zone | Required Biome | Height Range | Extra |
|-----------|--------------|----------------|--------------|-------|
| Village | Valley, Meadow | Plains, Forest | 63-80 | Near water (height < SEA_LEVEL+3 within 3 chunks) |
| Temple | Hills, Cliffs | Any land | 80+ | Elevated, flat area nearby |
| Port | Coast | Beach | 60-65 | Near ocean (cont < 0.1 within 2 chunks) |
| Mine | Mountain Range | Mountains, Stony Peaks | 40-70 | Underground entrance |
| Ruins | Any | Any land | 65-90 | Not in dense forest |
| Watchtower | Cliffs, Hills | Any land | 85+ | Max visibility |

3. Probability per chunk:
   - Base: 1% (same as v6.0)
   - Modified by zone type (valley ×3, coast ×2 for port, etc.)
   - Modified by region type (mountain range ×5 for mine)

4. Contextual checks:
   - Water proximity: sample heightmap in radius for water blocks
   - Elevation: check chunk average height
   - Flatness: check height variance within chunk

## Acceptance Criteria

- [ ] Villages only generate near water
- [ ] Mines only generate in mountain regions
- [ ] Temples only generate on elevated terrain
- [ ] Ports only generate near coast
- [ ] Structure placement is deterministic from seed
- [ ] No structures in ocean (except monuments, which stay as v6.0)

## Implementation Notes

- Replace existing `generateStructures()` biome-only logic
- Water proximity: check 3-chunk radius heightmap for blocks < SEA_LEVEL
- Elevation: use `ChunkContext.heightMap` average
- Flatness: compute std-dev of heightMap, < 5 = flat enough for village
- Keep existing structure generation functions, just change placement logic
