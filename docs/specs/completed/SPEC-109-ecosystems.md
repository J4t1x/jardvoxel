# SPEC-109: Ecosystems — Ecological Generation Rules

**Priority:** Medium  
**Estimate:** 1h  
**Depends on:** SPEC-104, SPEC-105  
**Blocked by:** SPEC-105

## Description

Biomes evolve into complete ecosystems with ecological rules. A forest automatically includes diverse tree species, shrubs, flowers, moss, mushrooms, rocks, insects, birds, streams, and clearings.

## Requirements

1. `EcosystemSystem` class:
   - `getEcosystem(biome, zone)` — returns ecosystem profile
   - `applyEcosystem(chunk, context, layer)` — generates ecosystem-appropriate content

2. Ecosystem profiles per biome:

| Biome | Trees | Shrubs | Flowers | Mushrooms | Moss | Rocks | Fauna | Water |
|-------|-------|--------|---------|-----------|------|-------|-------|-------|
| Forest | Oak, Birch | ✓ | ✓ | ✓ | ✓ | ✓ | Birds, foxes | Streams |
| Jungle | Jungle, Giant | ✓ | ✓ | ✓ | ✓ | ✗ | Parrots, ocelots | Pools |
| Taiga | Spruce | ✗ | ✗ | ✓ | ✓ | ✓ | Wolves, rabbits | ✗ |
| Desert | ✗ | Dead bush | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Swamp | Oak (dead) | ✓ | ✓ | ✓ | ✓ | ✓ | Frogs | Puddles |
| Plains | Oak (rare) | ✗ | ✓ | ✗ | ✗ | ✗ | Rabbits, horses | ✗ |
| Meadow | Oak, Birch | ✓ | ✓ (many) | ✗ | ✗ | ✗ | Butterflies, bees | ✗ |
| Cherry | Cherry | ✓ | ✓ (pink) | ✗ | ✗ | ✗ | Bees | ✗ |

3. Ecological rules:
   - Tree clustering: trees grow in groves, not uniformly
   - Understory: flowers grow at forest edges, moss in deep forest
   - Water proximity: more vegetation near water
   - Clearings: natural openings in forests (no trees, just grass + flowers)
   - Dead wood: fallen logs in older forests

4. Integration with microsectors: ecosystem determines microsector decoration

## Acceptance Criteria

- [ ] Forests have diverse tree species + understory
- [ ] Clearings appear naturally in forests
- [ ] Vegetation density increases near water
- [ ] Fallen logs generate in forest biomes
- [ ] Each biome feels ecologically distinct

## Implementation Notes

- Ecosystem profiles: static config object keyed by biome
- Tree clustering: use existing `FeaturePlacer.clusterNoise`
- Clearings: inverse cluster noise (when cluster < -0.5, no trees)
- Fallen logs: 2-3 block horizontal WOOD on surface in forests
- Water proximity: check `getBaseHeight < SEA_LEVEL + 5` for nearby water
