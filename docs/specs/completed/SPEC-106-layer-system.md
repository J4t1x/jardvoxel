# SPEC-106: 9-Layer Progressive Chunk Generation

**Priority:** High  
**Estimate:** 2h  
**Depends on:** SPEC-104, SPEC-105  
**Blocked by:** SPEC-105

## Description

Chunk generation split into 9 independent layers that can load progressively as the player explores.

## Requirements

1. `LayerSystem` class managing 9 layers:

| Layer | Name | Content | Load Priority |
|-------|------|---------|---------------|
| 1 | Terrain | Stone, dirt, grass, sand, water | Always (immediate) |
| 2 | Micro-relief | Small surface irregularities | Always (immediate) |
| 3 | Surface rocks | Boulders, rock formations | High (near) |
| 4 | Major vegetation | Trees | High (near) |
| 5 | Minor vegetation | Flowers, grass, bushes | Medium (near-medium) |
| 6 | Natural decoration | Logs, moss, mushrooms, stones | Medium (near-medium) |
| 7 | Fauna | Mob spawns | Low (near only) |
| 8 | Ambient audio | Biome sound triggers | Low (near only) |
| 9 | Dynamic events | Butterflies, fireflies, falling leaves, mist | Low (near only) |

2. Each layer:
   - `generate(chunk, context)` — applies layer to chunk
   - `getLoadPriority()` — returns priority enum
   - `isRequired()` — true for layers 1-2 (always loaded)

3. Progressive loading:
   - Layers 1-2: loaded on chunk generation
   - Layers 3-6: loaded when chunk is within render distance
   - Layers 7-9: loaded only when player is within 2 chunks

4. Layer registry — layers can be added/removed without modifying core

## Acceptance Criteria

- [ ] All 9 layers implemented and functional
- [ ] Progressive loading works (distant chunks skip layers 7-9)
- [ ] Layer order is correct (terrain before vegetation before fauna)
- [ ] Layers are modular (can disable individual layers)
- [ ] No visual regression vs v6.0 for layers 1-6

## Implementation Notes

- Layers 1-2 map to existing `chunk.generate()` + microsectors
- Layer 3-6 map to existing `generateTrees`, `generateDecoration`, `generateStructures`
- Layer 7 hooks into existing mob spawn system
- Layer 8 hooks into existing ambient sound system
- Layer 9 hooks into existing particle system (ambient particles)
- Use a simple array registry, iterate in order
